'use client';

import { PageHeader } from '@/components/common';
import { BillingHome } from '@/features/contract-billing';

export default function BillingPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Billing"
        description="Running account and milestone bills raised by contractors, from the claim through joint measurement and certification to final approval. Choose RA or milestone billing for each contract when you start billing it."
      />
      <BillingHome />
    </div>
  );
}
