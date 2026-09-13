'use client';

import { Suspense } from 'react';
import { BillingSettingsView } from '@/features/billing';

export default function BillingSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your organization&apos;s plan, payment method and invoices.
        </p>
      </div>
      <Suspense fallback={null}>
        <BillingSettingsView />
      </Suspense>
    </div>
  );
}
