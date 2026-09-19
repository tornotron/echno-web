'use client';

import { useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { AttachmentType } from '@tornotron/echno-core/attachment/types';
import {
  useRegisterToolboxTalkPhotos,
  useToolboxTalkPhotos,
} from '@tornotron/echno-core/toolbox-talks/hooks';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import { uploadTalkPhotos } from '../lib/talk-photos';

interface ToolboxTalkPhotosProps {
  talkId: string;
}

/**
 * The talk's photo evidence: what is registered, and a picker that runs the
 * presign, PUT, register path. Registering goes through the mutation hook so
 * the strip refreshes on its own.
 */
export function ToolboxTalkPhotos({ talkId }: ToolboxTalkPhotosProps) {
  const { data: photos, isPending } = useToolboxTalkPhotos(talkId);
  const register = useRegisterToolboxTalkPhotos();
  const [uploading, setUploading] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProblems([]);
    try {
      const { errors } = await uploadTalkPhotos(
        talkId,
        [...files],
        (id, data) => register.mutateAsync({ id, data })
      );
      setProblems(errors.map((error) => `${error.filename}: ${error.message}`));
    } catch (error) {
      setProblems([getErrorMessage(error)]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3" data-testid="toolbox-talk-photos">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Photos</h3>
        <Button variant="outline" size="sm" asChild disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Add photos"
              disabled={uploading}
              onChange={(event) => {
                void pick(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
        </Button>
      </div>
      {isPending && (
        <div className="flex gap-2">
          <Skeleton className="h-20 w-20 rounded-md" />
          <Skeleton className="h-20 w-20 rounded-md" />
        </div>
      )}
      {photos && photos.length === 0 && (
        <p className="text-muted-foreground text-sm">No photos yet.</p>
      )}
      {photos && photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) =>
            photo.fileType === AttachmentType.image ? (
              <a
                key={photo.id}
                href={photo.file}
                target="_blank"
                rel="noreferrer"
                className="h-20 w-20 overflow-hidden rounded-md border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.file}
                  alt={photo.fileName}
                  className="h-full w-full object-cover"
                />
              </a>
            ) : (
              <a
                key={photo.id}
                href={photo.file}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border p-1 text-xs"
              >
                <FileText className="size-5" />
                <span className="truncate">{photo.fileName}</span>
              </a>
            )
          )}
        </div>
      )}
      {problems.length > 0 && (
        <ul role="alert" className="text-destructive text-sm">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
