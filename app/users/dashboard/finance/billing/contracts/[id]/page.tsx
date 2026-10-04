'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { ContractBillingView } from '@/features/contract-billing';

export default function ContractBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const subContractId = /^\d+$/.test(id) ? Number(id) : Number.NaN;
  if (!Number.isSafeInteger(subContractId) || subContractId <= 0) {
    notFound();
  }
  return <ContractBillingView subContractId={subContractId} />;
}
