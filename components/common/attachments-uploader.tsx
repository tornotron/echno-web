'use client';

import { useRef } from 'react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Upload, Loader2 } from 'lucide-react';

interface AttachmentsUploaderProps {
  onUpload: (files: File[]) => void;
  isPending?: boolean;
}

export function AttachmentsUploader({
  onUpload,
  isPending = false,
}: AttachmentsUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    onUpload([...e.target.files]);
    e.target.value = '';
  };

  return (
    <div>
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
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? (
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
