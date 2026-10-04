'use client';

import { use } from 'react';
import { BillView } from '@/features/contract-billing';

export default function BillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BillView billId={id} />;
}
