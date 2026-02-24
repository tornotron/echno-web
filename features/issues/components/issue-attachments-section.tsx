'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  FileText,
  X,
  Paperclip,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
} from 'lucide-react';
import type { AttachmentType } from '@/types/attachment';
import { toast } from '@/lib/styles/toast-styles';

interface IssueAttachmentsSectionProps {
  newAttachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

export function IssueAttachmentsSection({
  newAttachments,
  onAttachmentsChange,
  onRemoveAttachment,
}: IssueAttachmentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

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
      toast.error('Some files exceed 10MB', {
        description: `The following files were not added: ${invalidFiles.join(', ')}`,
      });
    }

    if (validFiles.length > 0) {
      onAttachmentsChange([...newAttachments, ...validFiles]);
    }

    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Issue Attachments
              {newAttachments.length > 0 && (
                <Badge variant="outline">{newAttachments.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Files attached to this issue</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {newAttachments.length === 0 && (
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
          Upload Files
        </Button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF (Max 10MB each)
        </p>

        {newAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Files to Upload ({newAttachments.length})
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
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
