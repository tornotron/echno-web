'use client';

import { Button } from '@/components/ui/button';

export function ReloadButton({ label = 'Reload Page' }: { label?: string }) {
  return (
    <Button
      variant="default"
      className="w-full"
      onClick={() => globalThis.location.reload()}
    >
      {label}
    </Button>
  );
}
