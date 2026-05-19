'use client';

import { use } from 'react';
import { Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { routes } from '@/nav';
import { useVendor } from '@/hooks/vendors';
import { VendorEditor } from '@/features/vendor/components/vendor-editor';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

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

  if (!vendor) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <Building2 className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Vendor not found</EmptyTitle>
          <EmptyDescription>
            This vendor may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.vendors.href}>Back to Vendors</Link>
        </Button>
      </Empty>
    );
  }

  return <VendorEditor vendor={vendor} vendorId={vendorId} />;
}
