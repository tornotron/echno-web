'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import { useCreateAsset } from '@/hooks/assets/use-assets';
import {
  AssetForm,
  AssetFormData,
  ASSET_FORM_ID,
} from '@/features/assets/components/asset-form';

export default function NewAssetPage() {
  const router = useRouter();
  const createAsset = useCreateAsset();
  const isPending = createAsset.isPending;

  async function handleSubmit(data: AssetFormData) {
    try {
      await createAsset.mutateAsync(data);
      toast.success('Asset registered successfully!');
      router.push(routes.resources.assets.href);
    } catch (error) {
      toast.error('Failed to register asset', {
        description: getErrorMessage(error),
      });
    }
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
