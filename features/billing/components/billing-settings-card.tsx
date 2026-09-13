'use client';

import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { useAuthorization } from '@/hooks/use-authorization';
import { BILLING_SETTINGS_PATH } from '@/lib/billing/paths';

/**
 * The Billing entry on the settings page. The backend serves the billing
 * surface to the organization's system admin only (#456), so the card is
 * rendered for that role alone; anyone else would land on a page whose
 * every call answers 403.
 */
export function BillingSettingsCard() {
  const router = useRouter();
  const { isSystemAdmin, isLoading } = useAuthorization();
  if (isLoading || !isSystemAdmin) return null;

  return (
    <Card data-testid="billing-settings-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Billing</CardTitle>
        </div>
        <CardDescription>
          Your organization&apos;s plan, payment method and invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => router.push(BILLING_SETTINGS_PATH)}>
          Manage plan and billing
        </Button>
      </CardContent>
    </Card>
  );
}
