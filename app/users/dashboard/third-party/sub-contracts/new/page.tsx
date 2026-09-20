'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import { SubContractForm } from '@/features/sub-contracts';
import type { SubContractFormValues } from '@/features/sub-contracts/components/sub-contract-form';
import { useCreateSubContract } from '@/hooks/sub-contracts';
import { AccessGate } from '@/components/common';
import { SUB_CONTRACT_WRITE_ACCESS } from '@/nav/access/roles';

function SubContractNewPageContent() {
  const router = useRouter();
  const createSubContract = useCreateSubContract();

  async function handleSubmit(values: SubContractFormValues) {
    try {
      await createSubContract.mutateAsync(values);
      toast.success('Sub-contract created successfully');
      router.push(routes.thirdParty.subContracts.href);
    } catch (error) {
      toast.error('Failed to create sub-contract', {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <SubContractForm
      isEditMode={false}
      onSubmit={handleSubmit}
      isSubmitting={createSubContract.isPending}
    />
  );
}

export default function SubContractNewPage() {
  return (
    <AccessGate
      config={SUB_CONTRACT_WRITE_ACCESS}
      subject="create sub-contracts"
      allowed="system administrators and project managers"
      backHref={routes.thirdParty.href}
      backLabel="Back to Third Party"
    >
      <SubContractNewPageContent />
    </AccessGate>
  );
}
