'use client';

import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useCreateBimModel } from '@tornotron/echno-core/bim/hooks';
import type { BimModel } from '@tornotron/echno-core/bim/types';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { useAuthorization } from '@/hooks/use-authorization';
import { Label } from '@/components/shadcn/label';
import { Progress } from '@/components/shadcn/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { useBimSourceUpload, type BimUploadStage } from '../lib/use-bim-source-upload';
import { ImportJobStatus } from './import-job-status';

const STAGE_LABELS: Record<BimUploadStage, string> = {
  idle: '',
  presign: 'Creating the version',
  put: 'Uploading the IFC',
  register: 'Registering the upload',
  enqueue: 'Queuing the import',
  done: 'Upload complete',
  error: 'Upload failed',
};

const NEW_MODEL = '__new__';

interface ModelUploadDialogProps {
  projectId: number;
  models: BimModel[];
  /** Preselect a model; otherwise the first one, or a new one when none exist. */
  defaultModelId?: string;
  trigger?: React.ReactNode;
}

/**
 * Uploads an IFC as the next version of a model: presigned PUT to the object
 * store, register, queue the worker, then narrate the job until it is DONE.
 *
 * Rendered only for managers and above: the backend refuses the upload to
 * anyone else, so a member should not be offered a button that ends in a
 * 403 toast (web #456).
 */
export function ModelUploadDialog({
  projectId,
  models,
  defaultModelId,
  trigger,
}: ModelUploadDialogProps) {
  const { isManagerOrAbove } = useAuthorization();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>(
    defaultModelId ?? models[0]?.id ?? NEW_MODEL
  );
  const [newName, setNewName] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const createModel = useCreateBimModel(projectId);
  const modelId = choice === NEW_MODEL ? undefined : choice;
  const { state, upload, reset } = useBimSourceUpload(modelId);

  const busy = useMemo(
    () => createModel.isPending || !['idle', 'done', 'error'].includes(state.stage),
    [createModel.isPending, state.stage]
  );

  async function start() {
    if (!file) return;
    if (choice === NEW_MODEL) {
      let model: BimModel;
      try {
        model = await createModel.mutateAsync({ name: newName.trim() || file.name });
      } catch {
        // The mutation surfaces its own error state; nothing to upload into.
        return;
      }
      // Select the created model so a retry uploads into it instead of
      // creating a second one, and hand the id straight to the upload: the
      // hook's bound id only catches up on the next render (web #454).
      setChoice(model.id);
      await upload(file, model.id);
      return;
    }
    await upload(file);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setFile(undefined);
    }
  }

  if (!isManagerOrAbove) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Upload className="size-4" />
            Upload IFC
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a BIM model</DialogTitle>
          <DialogDescription>
            The IFC goes straight to the object store (up to 1 GB), then the
            import worker parses it into storeys and elements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bim-model">Model</Label>
            <Select value={choice} onValueChange={setChoice} disabled={busy || state.stage === 'done'}>
              <SelectTrigger id="bim-model">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} (v{m.versions[0]?.versionNumber ?? 0})
                  </SelectItem>
                ))}
                {createModel.data && !models.some((m) => m.id === createModel.data.id) && (
                  <SelectItem value={createModel.data.id}>
                    {createModel.data.name} (new)
                  </SelectItem>
                )}
                <SelectItem value={NEW_MODEL}>New model</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {choice === NEW_MODEL && (
            <div className="space-y-1.5">
              <Label htmlFor="bim-model-name">Model name</Label>
              <Input
                id="bim-model-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tower A, structural"
                disabled={busy}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="bim-file">IFC file</Label>
            <Input
              id="bim-file"
              type="file"
              accept=".ifc,.ifczip"
              disabled={busy || state.stage === 'done'}
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>

          {createModel.isError && state.stage === 'idle' && (
            <p className="text-sm text-red-700 dark:text-red-400" data-testid="create-model-error">
              Could not create the model. {createModel.error.message}
            </p>
          )}
          {state.stage !== 'idle' && state.stage !== 'done' && (
            <div className="space-y-2" data-testid="upload-stage" data-stage={state.stage}>
              <div className="text-sm">{STAGE_LABELS[state.stage]}</div>
              {state.stage === 'put' && <Progress value={state.progress} />}
              {state.stage === 'error' && (
                <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>
              )}
            </div>
          )}
          {state.stage === 'done' && <ImportJobStatus jobId={state.jobId} />}
        </div>

        <DialogFooter>
          {state.stage === 'done' ? (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          ) : (
            <Button onClick={() => void start()} disabled={!file || busy}>
              <Upload className="size-4" />
              Upload and import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
