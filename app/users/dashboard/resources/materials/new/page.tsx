'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useCreateMaterial } from '@tornotron/echno-core/materials/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Loader2, Save } from 'lucide-react';
import {
  MaterialForm,
  MATERIAL_FORM_ID,
} from '@/features/materials/components/material-form';
import { CreateMaterialRequest } from '@tornotron/echno-core/materials/types';

export default function NewMaterialPage() {
  const router = useRouter();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const { mutate: createMaterial, isPending } = useCreateMaterial();

  if (!currentEmployee) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  function handleSubmit(data: CreateMaterialRequest) {
    createMaterial(data, {
      onSuccess: (material) => {
        toast.success('Material Created', {
          description: 'The material has been created successfully.',
        });
        router.push(routes.resources.materials.detail(material.id).href);
      },
      onError: (error) => {
        toast.error(getErrorTitle(error, 'Failed to Create Material'), {
          description: getErrorMessage(error),
        });
      },
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Add Material"
        description="Create a new material record"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.materials.href}>Cancel</Link>
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
                  Create Material
                </>
              )}
            </Button>
          </>
        }
      />
      <MaterialForm
        mode="create"
        createdBy={currentEmployee.id}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
