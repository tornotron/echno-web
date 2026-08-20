'use client';

import { useCallback, useState } from 'react';
import { useUploadAttachmentsDirect } from '@tornotron/echno-core/attachment/hooks';
import type { DirectUploadResult } from '@tornotron/echno-core/attachment/types';

/** UI status for a single file in a direct-to-storage upload batch. */
export type FileUploadStatus = 'uploading' | 'done' | 'error';

/** Per-file progress/outcome, aligned by index to the files array. */
export interface FileUploadState {
  percent: number;
  status: FileUploadStatus;
  error?: string;
}

/**
 * Drives the presigned direct-to-storage upload (echno-core
 * `useUploadAttachmentsDirect`) and tracks per-file progress + outcome so the
 * caller can render progress bars and partial-failure state in the attachments
 * UI.
 *
 * The returned `states` array is index-aligned to the `files` passed to
 * `upload`, which callers hold in the same order, so a form can render
 * `states[i]` next to its i-th "new file" row.
 *
 * A partial failure is a normal (non-throwing) resolution: `upload` resolves
 * with the core {@link DirectUploadResult}, whose `attachments` are the files
 * that registered and whose `errors` are the ones that failed. Callers decide
 * how to surface each.
 */
export function useDirectAttachmentUpload() {
  const mutation = useUploadAttachmentsDirect();
  const [states, setStates] = useState<FileUploadState[]>([]);

  const reset = useCallback(() => setStates([]), []);

  const upload = useCallback(
    async (
      entityId: number,
      entityType: string,
      files: File[]
    ): Promise<DirectUploadResult> => {
      if (files.length === 0) {
        return { attachments: [], errors: [] };
      }

      setStates(files.map(() => ({ percent: 0, status: 'uploading' })));

      const result = await mutation.mutateAsync({
        entityId,
        entityType,
        files,
        onProgress: (progress, index) => {
          setStates((prev) => {
            const next = [...prev];
            next[index] = {
              percent: progress.percent ?? next[index]?.percent ?? 0,
              status: 'uploading',
            };
            return next;
          });
        },
      });

      // Finalise: mark each file done or errored. Errors are matched by
      // filename; when several files share a name they are consumed in order
      // so each error is attributed once.
      const remainingErrors = [...result.errors];
      setStates(
        files.map((file, index) => {
          const errIndex = remainingErrors.findIndex(
            (e) => e.filename === file.name
          );
          if (errIndex !== -1) {
            const [err] = remainingErrors.splice(errIndex, 1);
            return {
              percent: states[index]?.percent ?? 0,
              status: 'error',
              error: err.message,
            };
          }
          return { percent: 100, status: 'done' };
        })
      );

      return result;
    },
    // `states` is intentionally omitted: it is only read to preserve the last
    // known percent on a failed file, and including it would rebuild `upload`
    // on every progress tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation]
  );

  return { upload, states, reset, isUploading: mutation.isPending };
}
