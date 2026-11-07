'use client';

import { PageHeader } from '@/components/common';
import { BillingHome } from '@/features/contract-billing';

export default function BillingPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Billing"
        description="Running account and milestone bills raised by contractors, by project, from the claim through joint measurement and certification to approval and payment."
      />
      <BillingHome />
    </div>
  );
}
