'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import type { Attachment } from '@/types/attachment';
import { toast } from '@/lib/styles/toast-styles';

interface AttachmentsSectionProps {
  existingAttachments?: Attachment[];
  newAttachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export function AttachmentsSection({
  existingAttachments,
  newAttachments,
  onAttachmentsChange,
  onRemoveAttachment,
}: AttachmentsSectionProps) {
  const attachmentsInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = [...e.target.files];
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      }

      if (invalidFiles.length > 0) {
        toast.error(
          `The following files exceed 10MB and were not added: ${invalidFiles.join(', ')}`
        );
      }

      if (validFiles.length > 0) {
        onAttachmentsChange([...newAttachments, ...validFiles]);
      }

      // Reset the input value so the same file can be selected again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    attachmentsInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>Attachments</Label>
      <div className="space-y-4">
        {/* Existing Attachments */}
        {existingAttachments && existingAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Current Attachments ({existingAttachments.length})
            </p>
            {existingAttachments.map((attachment, index) => (
              <div
                key={attachment.id || `existing-${index}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Attachments Upload */}
        <div className="space-y-2">
          <Input
            ref={attachmentsInputRef}
            id="attachments"
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
            onClick={handleUploadClick}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload New Files
          </Button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF (Max 10MB each)
          </p>
        </div>

        {/* New Files to Upload */}
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
      </div>
    </div>
  );
}
