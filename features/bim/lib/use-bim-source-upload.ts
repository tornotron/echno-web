'use client';

import { useCallback, useState } from 'react';
import { attachmentService } from '@tornotron/echno-core/attachment/services';
import { bimService } from '@tornotron/echno-core/bim/services';
import { BIM_SOURCE_MAX_BYTES } from '@tornotron/echno-core/bim/types';
import { useQueryClient } from '@tanstack/react-query';
import { bimKeys } from '@tornotron/echno-core/bim/hooks/keys';

export type BimUploadStage =
  | 'idle'
  | 'presign'
  | 'put'
  | 'register'
  | 'enqueue'
  | 'done'
  | 'error';

export interface BimUploadState {
  stage: BimUploadStage;
  /** 0..100 of the PUT, the only long step. */
  progress: number;
  versionId?: string;
  jobId?: string;
  error?: string;
}

/** Guards the 1 GB cap before a byte leaves the browser. */
export function checkBimSourceFile(file: File): string | undefined {
  if (file.size <= 0) return 'The file is empty.';
  if (file.size > BIM_SOURCE_MAX_BYTES) {
    return 'IFC files above 1 GB are refused. Split the model by building and upload each part.';
  }
  if (!/\.ifc(zip)?$/i.test(file.name)) {
    return 'Upload an IFC file (.ifc).';
  }
  return undefined;
}

/**
 * Runs the four-step upload: presign (creates the next version), PUT the IFC
 * straight to the object store, register the upload, then queue the worker
 * import. Each stage is exposed so the dialog can narrate it.
 */
export function useBimSourceUpload(modelId: string | undefined) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BimUploadState>({ stage: 'idle', progress: 0 });

  const upload = useCallback(
    async (file: File) => {
      if (!modelId) return;
      const problem = checkBimSourceFile(file);
      if (problem) {
        setState({ stage: 'error', progress: 0, error: problem });
        return;
      }
      try {
        setState({ stage: 'presign', progress: 0 });
        const slot = await bimService.presignSource(modelId, {
          filename: file.name,
          fileSize: file.size,
          contentType: file.type || 'application/x-step',
        });
        setState({ stage: 'put', progress: 0, versionId: slot.versionId });
        await attachmentService.putToStorage(
          slot.upload.url,
          file,
          slot.upload.contentType,
          (p) => setState((s) => ({ ...s, progress: p.percent ?? 0 }))
        );
        setState({ stage: 'register', progress: 100, versionId: slot.versionId });
        await bimService.registerSource(modelId, slot.versionId);
        setState({ stage: 'enqueue', progress: 100, versionId: slot.versionId });
        const job = await bimService.enqueueImport(modelId, slot.versionId);
        queryClient.setQueryData(bimKeys.job(job.id), job);
        await queryClient.invalidateQueries({ queryKey: bimKeys.all });
        setState({ stage: 'done', progress: 100, versionId: slot.versionId, jobId: job.id });
      } catch (error) {
        setState((s) => ({
          ...s,
          stage: 'error',
          error: error instanceof Error ? error.message : 'Upload failed.',
        }));
      }
    },
    [modelId, queryClient]
  );

  const reset = useCallback(() => setState({ stage: 'idle', progress: 0 }), []);

  return { state, upload, reset };
}
