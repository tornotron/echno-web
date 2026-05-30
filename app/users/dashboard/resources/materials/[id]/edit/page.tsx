'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Package, Save } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useMaterial, useUpdateMaterial } from '@/hooks/materials';
import {
  MaterialForm,
  MATERIAL_FORM_ID,
} from '@/features/materials/components/material-form';
import { UpdateMaterialRequest } from '@/types/materials/material-update';

export default function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: material, isLoading } = useMaterial(id);
  const { mutate: updateMaterial, isPending } = useUpdateMaterial();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!material) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Package className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Material not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.materials.href}>Back to Materials</Link>
        </Button>
      </Empty>
    );
  }

  function handleSubmit(data: UpdateMaterialRequest) {
    updateMaterial(
      { id, data },
      {
        onSuccess: () => {
          router.push(routes.resources.materials.detail(id).href);
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Edit Material"
        description={`Update details for ${material.materialName}`}
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.materials.detail(id).href}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" form={MATERIAL_FORM_ID} disabled={isPending}>
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
      <MaterialForm mode="edit" material={material} onSubmit={handleSubmit} />
    </div>
  );
}
