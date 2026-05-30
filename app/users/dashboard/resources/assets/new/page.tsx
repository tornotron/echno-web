'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  AssetForm,
  AssetFormData,
  ASSET_FORM_ID,
} from '@/features/assets/components/asset-form';

export default function NewAssetPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  function handleSubmit(data: AssetFormData) {
    setIsPending(true);
    // TODO: replace with real mutation when asset create endpoint is wired
    setTimeout(() => {
      toast.success('Asset registered successfully!');
      router.push(routes.resources.assets.href);
    }, 1000);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Register New Asset"
        description="Add a new asset to your inventory"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.assets.href}>Cancel</Link>
            </Button>
            <Button type="submit" form={ASSET_FORM_ID} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Asset
                </>
              )}
            </Button>
          </>
        }
      />
      <AssetForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
