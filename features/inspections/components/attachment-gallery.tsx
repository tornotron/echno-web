'use client';

/**
 * Attachment rendering shared by NCR evidence, comment media and inspection
 * reference documents.
 *
 * Images and video render inline because on a defect the picture *is* the
 * record; anything else falls back to a named file chip.
 */

import { FileText, Play, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/shadcn/dialog';
import { cn } from '@/lib/utils/index';
import { type InspectionAttachment, formatFileSize } from '@/types/inspection';

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

interface AttachmentGalleryProps {
  attachments: InspectionAttachment[];
  /** Renders a remove affordance on each tile. */
  onRemove?: (attachment: InspectionAttachment) => void;
  className?: string;
  emptyMessage?: string;
}

export function AttachmentGallery({
  attachments,
  onRemove,
  className,
  emptyMessage,
}: AttachmentGalleryProps) {
  const [preview, setPreview] = useState<InspectionAttachment | undefined>();

  if (attachments.length === 0) {
    return emptyMessage ? (
      <p className="text-muted-foreground text-xs">{emptyMessage}</p>
    ) : null;
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4',
          className
        )}
      >
        {attachments.map((attachment) => (
          <AttachmentTile
            key={attachment.id}
            attachment={attachment}
            onOpen={() => setPreview(attachment)}
            onRemove={onRemove ? () => onRemove(attachment) : undefined}
          />
        ))}
      </div>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(undefined)}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle className="truncate text-sm">
            {preview?.fileName}
          </DialogTitle>
          {preview && <AttachmentPreview attachment={preview} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AttachmentTile({
  attachment,
  onOpen,
  onRemove,
}: {
  attachment: InspectionAttachment;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  // Seeded records carry no bytes, so there is nothing to render inline.
  const hasSource = attachment.url !== '';

  return (
    <div className="group/tile relative">
      <button
        type="button"
        onClick={onOpen}
        className="bg-muted hover:ring-ring block w-full overflow-hidden rounded-lg border text-left transition-all hover:ring-2"
      >
        <div className="flex aspect-video items-center justify-center overflow-hidden">
          {attachment.kind === 'image' && hasSource ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="size-full object-cover"
            />
          ) : (
            <AttachmentPlaceholderIcon attachment={attachment} />
          )}
        </div>
        <div className="px-2 py-1.5">
          <p className="truncate text-xs font-medium">{attachment.fileName}</p>
          <p className="text-muted-foreground text-[11px]">
            {formatFileSize(attachment.fileSize)}
            {attachment.uploadedByName && ` · ${attachment.uploadedByName}`}
          </p>
        </div>
      </button>

      {onRemove && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`Remove ${attachment.fileName}`}
          className="absolute top-1.5 right-1.5 size-6 opacity-0 transition-opacity group-hover/tile:opacity-100 focus-visible:opacity-100"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

function AttachmentPlaceholderIcon({
  attachment,
}: {
  attachment: InspectionAttachment;
}) {
  const Icon = attachment.kind === 'video' ? Play : FileText;
  return <Icon className="text-muted-foreground size-7" />;
}

function AttachmentPreview({
  attachment,
}: {
  attachment: InspectionAttachment;
}) {
  if (attachment.url === '') {
    return (
      <div className="text-muted-foreground flex aspect-video items-center justify-center rounded-lg border border-dashed text-sm">
        No preview available
      </div>
    );
  }

  if (attachment.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={attachment.url}
        alt={attachment.fileName}
        className="max-h-[70vh] w-full rounded-lg object-contain"
      />
    );
  }

  if (attachment.kind === 'video') {
    return (
      <video
        src={attachment.url}
        controls
        className="max-h-[70vh] w-full rounded-lg"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8">
      <FileText className="text-muted-foreground size-8" />
      <Button asChild variant="outline" size="sm">
        <a href={attachment.url} target="_blank" rel="noreferrer">
          Open {attachment.fileName}
        </a>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

interface MediaPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Defaults to images and video — the usual evidence on site. */
  accept?: string;
  label?: string;
}

/**
 * Staged-file picker for forms that upload on submit.
 *
 * Holds `File` objects rather than uploading immediately, so cancelling a
 * dialog never leaves orphaned uploads behind.
 */
export function MediaPicker({
  files,
  onChange,
  accept = 'image/*,video/*',
  label = 'Add Photos or Videos',
}: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(event) => {
          if (!event.target.files?.length) return;
          onChange([...files, ...event.target.files]);
          // Reset so picking the same file twice still fires a change.
          event.target.value = '';
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
            >
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-muted-foreground shrink-0">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
