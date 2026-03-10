'use client';

import { use } from 'react';
import { Loader2 } from 'lucide-react';
import { useVendor } from '@/hooks/vendors';
import { VendorEditor } from '@/features/vendor/components/vendor-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorEditPage({ params }: PageProps) {
  const { id } = use(params);
  const vendorId = Number(id);

  const { data: vendor, isLoading } = useVendor(vendorId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!vendor) return null;

  return <VendorEditor vendor={vendor} vendorId={vendorId} />;
}
