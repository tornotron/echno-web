'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { attachmentService } from '@tornotron/echno-core/attachment/services';
import {
  usePresignIngestDocument,
  useRegisterIngestDocument,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  DocumentClassification,
  ExtractJob,
  IngestDocument,
} from '@tornotron/echno-core/document-ingestion/types';
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
import {
  docClassLabel,
  documentStatusLabel,
  extractJobStatusLabels,
  segmentStatusLabels,
} from '../lib/labels';
import {
  formatBytes,
  INGEST_ACCEPT,
  ingestContentType,
  isIngestFileName,
  MAX_INGEST_FILE_BYTES,
} from '../lib/workbook';

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; fileName: string; percent: number }
  | { phase: 'done'; fileName: string }
  | { phase: 'error'; fileName: string; message: string };

/**
 * Uploads one tender file straight to storage: presign, PUT the bytes to
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
    if (!isIngestFileName(file.name)) {
      setState({
        phase: 'error',
        fileName: file.name,
        message:
          'Upload a PDF, an Excel workbook (.xlsx or .xls), a Word file (.docx), a drawing (.dxf or .dwg), or a ZIP of them. RAR, 7z and .doc files are not read.',
      });
      return;
    }
    if (file.size > MAX_INGEST_FILE_BYTES) {
      setState({
        phase: 'error',
        fileName: file.name,
        message: `The file is ${formatBytes(file.size)}; a single file can be up to 200 MB.`,
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
          contentType: ingestContentType(file),
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
          accept={INGEST_ACCEPT}
          className="hidden"
          aria-label="Tender file"
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
          Upload a file
        </Button>
        <span className="text-muted-foreground text-xs">
          PDF, Excel, Word, DXF, DWG, or a ZIP of them, up to 200 MB each.
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

/** The reading jobs of one document, newest last. */
function jobsOf(jobs: ExtractJob[], documentId: string): ExtractJob[] {
  return jobs.filter((j) => j.documentId === documentId);
}

/**
 * The package's files with what each one is and how far its reading got: the
 * file's own read, its class and parts, and each reading job with its chunks.
 */
export function IngestDocumentsTable({
  documents,
  classifications = [],
  jobs = [],
}: {
  documents: IngestDocument[];
  classifications?: DocumentClassification[];
  jobs?: ExtractJob[];
}) {
  const classes = new Map(classifications.map((c) => [c.documentId, c]));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Class and parts</TableHead>
          <TableHead>Reading</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-muted-foreground">
              No files yet.
            </TableCell>
          </TableRow>
        )}
        {documents.map((doc) => {
          const cls = classes.get(doc.id);
          const docJobs = jobsOf(jobs, doc.id);
          return (
            <TableRow key={doc.id} data-testid={`document-${doc.id}`}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{doc.fileName}</span>
                  <span className="text-muted-foreground text-xs">
                    {[
                      doc.pageCount === undefined
                        ? undefined
                        : `${doc.pageCount} pages`,
                      doc.sheetCount === undefined
                        ? undefined
                        : `${doc.sheetCount} sheets`,
                      doc.pagesOcr ? `${doc.pagesOcr} scanned` : undefined,
                      doc.revisionLabel,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatBytes(doc.sizeBytes)}</TableCell>
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
              <TableCell className="text-xs">
                {cls ? (
                  <div className="flex flex-col gap-0.5">
                    <span>
                      {docClassLabel(cls.docClass ?? doc.docClass)}
                      {cls.docClass && !cls.confirmed ? ', to confirm' : ''}
                    </span>
                    {cls.segments.map((s) => (
                      <span key={s.id} className="text-muted-foreground">
                        {s.sheetName
                          ? `Sheet ${s.sheetName}`
                          : `Pages ${s.pageFrom ?? '?'} to ${s.pageTo ?? '?'}`}
                        : {docClassLabel(s.docClass)}
                        {s.status ? `, ${segmentStatusLabels[s.status]}` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  docClassLabel(doc.docClass)
                )}
              </TableCell>
              <TableCell className="text-xs">
                {docJobs.length === 0 ? (
                  <span className="text-muted-foreground">None yet</span>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {docJobs.map((job) => (
                      <li key={job.id}>
                        {job.extractorKey}:{' '}
                        {extractJobStatusLabels[job.status] ?? job.status}
                        {job.chunksTotal > 0 &&
                          `, ${job.chunksDone} of ${job.chunksTotal} parts`}
                        {job.chunksFailed > 0 && `, ${job.chunksFailed} failed`}
                        {job.message && (
                          <span className="text-muted-foreground block">
                            {job.message}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
