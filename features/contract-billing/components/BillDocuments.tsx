'use client';

import { useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  contractBillingKeys,
  useBillDocuments,
  useDeleteBillDocument,
} from '@tornotron/echno-core/contract-billing/hooks';
import {
  BILL_DOCUMENT_TYPES,
  type Bill,
  type BillDocumentType,
} from '@tornotron/echno-core/contract-billing/types';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { toast } from '@/lib/styles/toast-styles';
import { uploadBillDocuments } from '../lib/documents';
import { formatDateTime } from '../lib/format';
import { DOCUMENT_TYPE_LABELS } from '../lib/labels';
import { SELECT_CLASS } from './chips';

/** Groups a bill's documents by type, in the order the mockup lists them; an unknown type files under others. */
export function groupDocuments(
  documents: Attachment[]
): Record<BillDocumentType, Attachment[]> {
  const groups = Object.fromEntries(
    BILL_DOCUMENT_TYPES.map((t) => [t, [] as Attachment[]])
  ) as Record<BillDocumentType, Attachment[]>;
  for (const doc of documents) {
    const type = (BILL_DOCUMENT_TYPES as readonly string[]).includes(
      doc.documentType ?? ''
    )
      ? (doc.documentType as BillDocumentType)
      : 'other';
    groups[type].push(doc);
  }
  return groups;
}

/**
 * Photos, test reports, delivery challans, measurement sheets and other
 * evidence for the bill. Files go straight to storage and are filed under the
 * type chosen; they can be added or removed while the bill is open.
 */
export function BillDocuments({
  bill,
  editable,
}: {
  bill: Bill;
  editable: boolean;
}) {
  const { data = [], isPending, isError, error } = useBillDocuments(bill.id);
  const remove = useDeleteBillDocument();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<BillDocumentType>('photo');
  const [uploading, setUploading] = useState(false);
  const groups = groupDocuments(data);

  const upload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const result = await uploadBillDocuments(bill.id, files, type);
      await queryClient.invalidateQueries({
        queryKey: contractBillingKeys.bill(bill.id),
      });
      if (result.errors.length > 0) {
        toast.error('Some files did not upload', {
          description: result.errors
            .map((e) => `${e.filename}: ${e.message}`)
            .join('; '),
        });
      } else {
        toast.success(`${result.attachments.length} file(s) added`);
      }
    } catch (error_) {
      toast.error(getErrorTitle(error_, 'Could not upload the files'), {
        description: getErrorMessage(error_),
      });
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Supporting documents ({data.length})</CardTitle>
        {editable && (
          <div className="flex gap-2">
            <select
              aria-label="Document type"
              className={`${SELECT_CLASS} w-44`}
              value={type}
              onChange={(e) => setType(e.target.value as BillDocumentType)}
            >
              {BILL_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOCUMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              ref={input}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => upload([...(e.target.files ?? [])])}
            />
            <Button
              size="sm"
              onClick={() => input.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-4" />
              {uploading ? 'Uploading...' : 'Add documents'}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && <Skeleton className="h-20 w-full" />}
        {isError && (
          <p role="alert" className="text-destructive text-sm">
            Could not load the documents: {getErrorMessage(error)}
          </p>
        )}
        {!isPending && !isError && data.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No documents yet. Attach site photos, test reports, delivery
            challans and measurement sheets that support the claim.
          </p>
        )}
        {BILL_DOCUMENT_TYPES.filter((t) => groups[t].length > 0).map((t) => (
          <div key={t} className="space-y-2">
            <p className="text-sm font-medium">
              {DOCUMENT_TYPE_LABELS[t]} ({groups[t].length})
            </p>
            <ul className="divide-y rounded-md border">
              {groups[t].map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 p-2 text-sm"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <a
                    href={doc.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate hover:underline"
                  >
                    {doc.fileName}
                  </a>
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(doc.createdAt.toISOString())}
                  </span>
                  {editable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${doc.fileName}`}
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(
                          { id: bill.id, attachmentId: doc.id },
                          {
                            onSuccess: () =>
                              toast.success(`${doc.fileName} removed`),
                            onError: (err) =>
                              toast.error(
                                getErrorTitle(
                                  err,
                                  'Could not remove the document'
                                ),
                                {
                                  description: getErrorMessage(err),
                                }
                              ),
                          }
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
