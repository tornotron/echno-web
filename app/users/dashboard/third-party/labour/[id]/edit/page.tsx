'use client';

import { useParams } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { Loader2, HardHat } from 'lucide-react';
import { useLabourById } from '@/hooks/labour';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import { LabourEditForm } from '@/features/labour';

export default function LabourFormPage() {
  const params = useParams();
  const isEdit = params?.id !== 'new';
  const labourId = isEdit ? Number(params.id) : 0;
  const { data: labourRecord, isLoading, isError } = useLabourById(labourId);

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isEdit && (isError || !labourRecord)) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <HardHat className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Labour record not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.labour.href}>Back to Labour</Link>
        </Button>
      </Empty>
    );
  }

  return <LabourEditForm initialData={labourRecord} isEdit={isEdit} />;
}
