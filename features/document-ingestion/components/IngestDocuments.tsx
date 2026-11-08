'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { attachmentService } from '@tornotron/echno-core/attachment/services';
import {
  usePresignIngestDocument,
  useRegisterIngestDocument,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type { IngestDocument } from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { documentStatusLabel } from '../lib/labels';
import {
  formatBytes,
  isWorkbookName,
  workbookContentType,
} from '../lib/workbook';

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; fileName: string; percent: number }
  | { phase: 'done'; fileName: string }
  | { phase: 'error'; fileName: string; message: string };

/**
 * Uploads one Excel workbook straight to storage: presign, PUT the bytes to
 * the signed url with the signed content type, then register the key so the
 * file is queued for reading. Mirrors `hooks/use-direct-attachment-upload.ts`
 * with the module's own presign and register calls.
 */
export function IngestUpload({ packageId }: { packageId: string }) {
  const presign = usePresignIngestDocument();
  const register = useRegisterIngestDocument();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: 'idle' });

  const upload = async (file: File) => {
    if (!isWorkbookName(file.name)) {
      setState({
        phase: 'error',
        fileName: file.name,
        message:
          'Only Excel workbooks (.xlsx or .xls) are read as a BOQ for now.',
      });
      return;
    }
    setState({ phase: 'uploading', fileName: file.name, percent: 0 });
    try {
      const slot = await presign.mutateAsync({
        packageId,
        req: {
          fileName: file.name,
          fileSize: file.size,
          contentType: workbookContentType(file),
        },
      });
      await attachmentService.putToStorage(
        slot.upload.url,
        file,
        slot.upload.contentType,
        (progress) =>
          setState({
            phase: 'uploading',
            fileName: file.name,
            percent: progress.percent ?? 0,
          })
      );
      await register.mutateAsync({
        packageId,
        documentId: slot.documentId,
        key: slot.upload.key,
      });
      setState({ phase: 'done', fileName: file.name });
    } catch (error) {
      setState({
        phase: 'error',
        fileName: file.name,
        message: getErrorMessage(error),
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          aria-label="BOQ workbook"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={state.phase === 'uploading'}
          onClick={() => input.current?.click()}
        >
          {state.phase === 'uploading' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload BOQ workbook
        </Button>
        <span className="text-muted-foreground text-xs">
          Excel only (.xlsx or .xls). Other files are kept but not read yet.
        </span>
      </div>
      {state.phase === 'uploading' && (
        <p className="text-sm">
          Uploading {state.fileName}: {Math.round(state.percent)}%
        </p>
      )}
      {state.phase === 'done' && (
        <p className="text-sm">
          {state.fileName} is uploaded and waiting to be read.
        </p>
      )}
      {state.phase === 'error' && (
        <p role="alert" className="text-destructive text-sm">
          {state.fileName}: {state.message}
        </p>
      )}
    </div>
  );
}

export function IngestDocumentsTable({
  documents,
}: {
  documents: IngestDocument[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Sheets</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              No files yet.
            </TableCell>
          </TableRow>
        )}
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.fileName}</TableCell>
            <TableCell>{formatBytes(doc.sizeBytes)}</TableCell>
            <TableCell>{doc.sheetCount ?? ''}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge
                  variant={
                    doc.status === 'FAILED'
                      ? 'destructive'
                      : doc.status === 'PARSED'
                        ? 'default'
                        : 'outline'
                  }
                  className="w-fit"
                >
                  {documentStatusLabel(doc)}
                </Badge>
                {doc.error && (
                  <span className="text-muted-foreground text-xs">
                    {doc.error}
                  </span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
