'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Upload,
  FileText,
  X,
  Paperclip,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  Trash2,
} from 'lucide-react';
import {
  formatFileSize,
  type Attachment,
  type AttachmentType,
} from '@tornotron/echno-core/attachment/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';

interface AttachmentsSectionProps {
  title?: string;
  existingAttachments?: Attachment[];
  newAttachments: File[];
  /** Called with the raw selected File list; caller is responsible for size validation and toasts. */
  onUploadFiles: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  /** Called with the attachment id when the user confirms deletion; caller is responsible for the mutation and toasts. */
  onDeleteAttachment: (id: number) => void;
}

const getAttachmentIcon = (type: AttachmentType) => {
  switch (type) {
    case 'image': {
      return ImageIcon;
    }
    case 'pdf':
    case 'document': {
      return FileText;
    }
    case 'spreadsheet': {
      return Sheet;
    }
    case 'cad': {
      return Box;
    }
    default: {
      return File;
    }
  }
};

export function AttachmentsSection({
  title = 'Attachments',
  existingAttachments,
  newAttachments,
  onUploadFiles,
  onRemoveAttachment,
  onDeleteAttachment,
}: AttachmentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(
    null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    onUploadFiles([...e.target.files]);
    e.target.value = '';
  };

  const handleConfirmDelete = () => {
    if (attachmentToDelete == null) return;
    onDeleteAttachment(attachmentToDelete);
    setAttachmentToDelete(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              {title}
              {existingAttachments && existingAttachments.length > 0 && (
                <Badge variant="outline">{existingAttachments.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Attach files to this record</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingAttachments && existingAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Current Attachments
            </p>
            <div className="flex flex-wrap gap-3">
              {existingAttachments.map((attachment) => {
                const Icon = getAttachmentIcon(attachment.fileType);
                const key =
                  attachment.id ||
                  `${attachment.file}-${attachment.createdAt?.getTime() ?? 'noDate'}`;
                return (
                  <div
                    key={key}
                    className="group relative flex h-28 w-28 flex-col items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="w-full truncate text-center text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                    {attachment.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAttachmentToDelete(attachment.id);
                        }}
                        className="absolute top-1 right-1 h-6 w-6 bg-red-500/90 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                        aria-label={`Delete ${attachment.fileName}`}
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(!existingAttachments || existingAttachments.length === 0) &&
            newAttachments.length === 0 && (
              <div className="py-8 text-center">
                <Paperclip className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No attachments yet
                </p>
              </div>
            )}
          <Input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload New Files
          </Button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, XLSX, DWG, DXF (Max 10MB each)
          </p>
        </div>

        {newAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              New Files to Upload ({newAttachments.length})
            </p>
            {newAttachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRemoveAttachment(index)}
                  aria-label={`Remove attachment ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!attachmentToDelete}
        onOpenChange={(open) => !open && setAttachmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
