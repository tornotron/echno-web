'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  DefectSeverity,
  defectSeverityLabels,
} from '@tornotron/echno-core/inspection/types';
import type { CreateObservationRequest } from '@tornotron/echno-core/inspection/types';
import { useCreateObservation } from '@/hooks/inspection';
import { AttachmentsSection } from '@/components/common';
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
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Textarea } from '@/components/shadcn/textarea';
import { SpatialLocationPicker } from '@/components/shared/spatial-location-picker';
import { uploadObservationEvidence } from '../lib/observation-evidence';

const NO_SEVERITY = 'NONE';

interface AddObservationDialogProps {
  projectId: number | undefined;
  /** Inspection to file it under, when opened from an inspection. */
  inspectionId?: string;
  trigger?: React.ReactNode;
}

/**
 * Records what the signed-in inspector saw: a human observation, created
 * accepted, with the site node from the project tree (or a free-text
 * place), and any photos put on it as evidence through the presigned
 * upload flow once the row exists.
 */
export function AddObservationDialog({
  projectId,
  inspectionId,
  trigger,
}: AddObservationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<string>(NO_SEVERITY);
  const [spatialNodeId, setSpatialNodeId] = useState<string | undefined>();
  const [locationNote, setLocationNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  // Set once the row exists but its evidence did not all upload: the next
  // submit retries the upload against this id instead of creating again.
  const [retryFor, setRetryFor] = useState<string | undefined>();
  const create = useCreateObservation();

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setSeverity(NO_SEVERITY);
    setSpatialNodeId(undefined);
    setLocationNote('');
    setFiles([]);
    setRetryFor(undefined);
  };

  const canSubmit =
    projectId !== undefined &&
    title.trim() !== '' &&
    !create.isPending &&
    !uploading;

  const finish = (message: string) => {
    toast.success(message);
    reset();
    setOpen(false);
  };

  const submit = async () => {
    if (projectId === undefined) return;
    let observationId = retryFor;
    if (observationId === undefined) {
      const req: CreateObservationRequest = {
        projectId,
        title: title.trim(),
      };
      if (inspectionId) req.inspectionId = inspectionId;
      if (description.trim()) req.description = description.trim();
      if (category.trim()) req.category = category.trim();
      if (severity !== NO_SEVERITY)
        req.suggestedSeverity = severity as DefectSeverity;
      if (spatialNodeId) req.spatialNodeId = spatialNodeId;
      if (locationNote.trim()) req.locationNote = locationNote.trim();
      try {
        const created = await create.mutateAsync(req);
        observationId = created.id;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'The observation could not be saved.'
        );
        return;
      }
    }
    // The row exists from here on: an evidence failure must not read as an
    // unsaved observation, or a retry records it twice. The dialog stays
    // open with the files still picked so the upload can be tried again.
    if (files.length === 0) {
      finish('Observation recorded');
      return;
    }
    setUploading(true);
    try {
      const { errors } = await uploadObservationEvidence(observationId, files);
      if (errors.length === 0) {
        finish('Observation recorded with evidence');
        return;
      }
      const failed = new Set(errors.map((e) => e.filename));
      setFiles((prev) => prev.filter((file) => failed.has(file.name)));
      setRetryFor(observationId);
      toast.error(
        `Observation recorded; ${errors.length} file${errors.length === 1 ? '' : 's'} failed to upload. Retry the upload or cancel to leave it without evidence.`
      );
    } catch {
      setRetryFor(observationId);
      toast.error(
        'Observation recorded, but its evidence could not be uploaded. Retry the upload or cancel to leave it without evidence.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            disabled={projectId === undefined}
            title={
              projectId === undefined ? 'Choose a project first' : undefined
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            Add observation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add observation</DialogTitle>
          <DialogDescription>
            {retryFor
              ? 'The observation is recorded. Only the evidence upload is retried; the fields above it are fixed.'
              : 'What you saw on site. It is recorded as accepted under your name; attach photos as evidence.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <fieldset
            className="space-y-4"
            disabled={retryFor !== undefined}
            data-testid="observation-fields"
          >
            <div className="space-y-1">
              <Label htmlFor="observation-title">Title</Label>
              <Input
                id="observation-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Hairline crack at column C-14"
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="observation-description">Description</Label>
              <Textarea
                id="observation-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={4000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="observation-category">Category</Label>
                <Input
                  id="observation-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="observation-severity">Suggested severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger id="observation-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SEVERITY}>Not set</SelectItem>
                    {Object.values(DefectSeverity).map((value) => (
                      <SelectItem key={value} value={value}>
                        {defectSeverityLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SpatialLocationPicker
              projectId={projectId}
              value={spatialNodeId}
              onChange={setSpatialNodeId}
              disabled={retryFor !== undefined}
            />
            <div className="space-y-1">
              <Label htmlFor="observation-location">Location note</Label>
              <Input
                id="observation-location"
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                placeholder="Where, when the tree has no node for it"
                maxLength={300}
              />
            </div>
          </fieldset>
          <AttachmentsSection
            title="Evidence"
            newAttachments={files}
            onUploadFiles={(picked) => setFiles((prev) => [...prev, ...picked])}
            onRemoveAttachment={(index) =>
              setFiles((prev) => prev.filter((_, i) => i !== index))
            }
            onDeleteAttachment={() => {}}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {uploading
              ? 'Uploading evidence'
              : retryFor
                ? 'Retry evidence upload'
                : 'Record observation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
