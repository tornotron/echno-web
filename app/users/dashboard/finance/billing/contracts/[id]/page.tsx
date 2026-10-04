'use client';

import { use } from 'react';
import { ContractBillingView } from '@/features/contract-billing';

export default function ContractBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ContractBillingView subContractId={Number(id)} />;
}
