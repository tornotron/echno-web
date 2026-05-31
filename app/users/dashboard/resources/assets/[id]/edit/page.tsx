'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Cog, Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useAsset } from '@/hooks/assets';
import {
  AssetForm,
  AssetFormData,
  ASSET_FORM_ID,
} from '@/features/assets/components/asset-form';

export default function EditAssetPage() {
  const { id } = useParams();
  const assetId = Number(id);
  const router = useRouter();

  const { data: asset } = useAsset(assetId);
  const [isPending, setIsPending] = useState(false);

  if (!asset) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Cog className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Asset not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.assets.href}>Back to Assets</Link>
        </Button>
      </Empty>
    );
  }

  function handleSubmit(data: AssetFormData) {
    setIsPending(true);
    // TODO: replace with real mutation when asset update endpoint is wired
    setTimeout(() => {
      toast.success('Asset updated successfully!');
      router.push(routes.resources.assets.detail(assetId).href);
      setIsPending(false);
    }, 1000);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Edit Asset"
        description={`Update details for ${asset.name}`}
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.assets.detail(assetId).href}>
                Cancel
              </Link>
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
                  Save Changes
                </>
              )}
            </Button>
          </>
        }
      />
      <AssetForm mode="edit" asset={asset} onSubmit={handleSubmit} />
    </div>
  );
}
