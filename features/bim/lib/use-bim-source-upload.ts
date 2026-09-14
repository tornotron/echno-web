'use client';

import { useCallback, useState } from 'react';
import { ApiError } from '@tornotron/echno-core';
import { attachmentService } from '@tornotron/echno-core/attachment/services';
import { bimService } from '@tornotron/echno-core/bim/services';
import {
  BIM_SOURCE_MAX_BYTES,
  isBimJobActive,
  type BimImportJob,
} from '@tornotron/echno-core/bim/types';
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
 * Whether an enqueue was refused because the version already has an open
 * job. The backend answers "An import job is already QUEUED for version x"
 * (409, or 400 on older builds), which after a fresh register means the
 * register call queued it: the upload has succeeded (web #462).
 */
export function isAlreadyQueued(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (/import job is already/i.test(error.message)) return true;
  return error instanceof ApiError && error.status === 409;
}

/**
 * The job that stands for a version's import: the open one when there is
 * one, else the most recently queued. The worker can finish a small IFC in
 * well under a second, so by the time the list is read the job may already
 * be DONE, and that job is still the one to show.
 */
export function pickVersionJob(jobs: BimImportJob[]): BimImportJob | undefined {
  const byRecency = jobs.toSorted((a, b) => (b.queuedAt ?? '').localeCompare(a.queuedAt ?? ''));
  return byRecency.find((j) => isBimJobActive(j.status)) ?? byRecency[0];
}

async function findVersionJob(modelId: string, versionId: string): Promise<BimImportJob | undefined> {
  return pickVersionJob(await bimService.listJobs(modelId, versionId));
}

/**
 * Runs the upload: presign (creates the next version), PUT the IFC straight
 * to the object store, register the upload, then make sure a worker import
 * is queued. Each stage is exposed so the dialog can narrate it.
 *
 * Register itself queues the import on the current backend (the version
 * comes back QUEUED), so the explicit enqueue runs only when the registered
 * version is still UPLOADED, and an "already queued" refusal of it counts as
 * success: either way the job is read back from the version's job list
 * rather than queued a second time (web #462).
 *
 * `upload` resolves with the state it ended in, so the caller can act on
 * success without watching the state. It takes an optional model id override for the case where the model
 * was created in the same click: the hook's `modelId` is bound at render
 * time, so a caller that has just created the model must hand the fresh id
 * in directly rather than wait for a re-render (web #454).
 */
export function useBimSourceUpload(modelId: string | undefined) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BimUploadState>({ stage: 'idle', progress: 0 });

  const upload = useCallback(
    async (file: File, modelIdOverride?: string): Promise<BimUploadState> => {
      const finish = (next: BimUploadState) => {
        setState(next);
        return next;
      };
      const targetId = modelIdOverride ?? modelId;
      if (!targetId) {
        return finish({ stage: 'error', progress: 0, error: 'Choose or create a model first.' });
      }
      const problem = checkBimSourceFile(file);
      if (problem) {
        return finish({ stage: 'error', progress: 0, error: problem });
      }
      try {
        setState({ stage: 'presign', progress: 0 });
        const slot = await bimService.presignSource(targetId, {
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
        const registered = await bimService.registerSource(targetId, slot.versionId);
        setState({ stage: 'enqueue', progress: 100, versionId: slot.versionId });
        let job: BimImportJob | undefined;
        if (registered.status !== 'UPLOADED') {
          // Register moved the version on (QUEUED on the current backend):
          // the job exists already.
          job = await findVersionJob(targetId, slot.versionId);
        }
        if (!job) {
          try {
            job = await bimService.enqueueImport(targetId, slot.versionId);
          } catch (enqueueError) {
            if (!isAlreadyQueued(enqueueError)) throw enqueueError;
            job = await findVersionJob(targetId, slot.versionId);
            if (!job) throw enqueueError;
          }
        }
        queryClient.setQueryData(bimKeys.job(job.id), job);
        await queryClient.invalidateQueries({ queryKey: bimKeys.all });
        return finish({ stage: 'done', progress: 100, versionId: slot.versionId, jobId: job.id });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed.';
        let ended: BimUploadState = { stage: 'error', progress: 0, error: message };
        setState((s) => {
          ended = { ...s, stage: 'error', error: message };
          return ended;
        });
        return ended;
      }
    },
    [modelId, queryClient]
  );

  const reset = useCallback(() => setState({ stage: 'idle', progress: 0 }), []);

  return { state, upload, reset };
}
