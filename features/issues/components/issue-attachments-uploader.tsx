'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useUpdateIssueWithFiles } from '@/hooks/issue';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface IssueAttachmentsUploaderProps {
  issueId: number;
  onUploadSuccess?: () => void;
}

export function IssueAttachmentsUploader({
  issueId,
  onUploadSuccess,
}: IssueAttachmentsUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateIssueWithFiles = useUpdateIssueWithFiles();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

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
        description: `The following files were not uploaded: ${invalidFiles.join(', ')}`,
      });
    }

    if (validFiles.length > 0) {
      updateIssueWithFiles.mutate(
        { id: issueId, data: {}, files: { attachments: validFiles } },
        { onSuccess: onUploadSuccess }
      );
    }

    e.target.value = '';
  };

  return (
    <div>
      <Input
        ref={inputRef}
        type="file"
        onChange={handleFileUpload}
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={updateIssueWithFiles.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {updateIssueWithFiles.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </>
        )}
      </Button>
    </div>
  );
}
