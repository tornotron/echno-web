'use client';

import { useParams, useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import { useSubContract, useUpdateSubContract } from '@/hooks/sub-contracts';
import type { SubContractFormValues } from '@/features/sub-contracts/components/sub-contract-form';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { SubContractForm } from '@/features/sub-contracts';

export default function SubContractEditPage() {
  const params = useParams();
  const router = useRouter();
  const isEditMode = params.id !== 'new';
  const contractId = isEditMode ? Number(params.id) : 0;
  const updateSubContract = useUpdateSubContract();
  const {
    data: subContractData,
    isLoading,
    isError,
  } = useSubContract(contractId);

  async function handleSubmit(values: SubContractFormValues) {
    try {
      await updateSubContract.mutateAsync({ id: contractId, values });
      toast.success('Sub-contract updated successfully');
      router.push(routes.thirdParty.subContracts.detail(contractId).href);
    } catch (error) {
      toast.error('Failed to update sub-contract', {
        description: getErrorMessage(error),
      });
    }
  }

  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isEditMode && (isError || !subContractData)) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <FileText className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Sub-contract not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.subContracts.href}>
            Back to Sub-Contracts
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <SubContractForm
      initialData={subContractData}
      isEditMode={isEditMode}
      id={params.id as string}
      onSubmit={handleSubmit}
      isSubmitting={updateSubContract.isPending}
    />
  );
}
