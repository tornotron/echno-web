'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  exceedsAfaCap,
  planIncludesFeature,
  type BillingPeriod,
  type BillingProviderInfo,
  type Plan,
  type Subscription,
} from '@tornotron/echno-core/billing/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { cn } from '@/lib/utils/index';
import { formatRupees } from '../lib/money';

export const BILLING_NOT_CONFIGURED_MESSAGE =
  'Online payments are not set up for this environment yet. Contact your administrator to change plans.';

interface PlanPickerProps {
  plans: Plan[];
  current: Subscription | null;
  provider: BillingProviderInfo | undefined;
  /** The feature key the buyer came for (a module's `MODULE_*` key); plans that include it are highlighted. */
  highlightFeature?: string | null;
  onSelect: (plan: Plan, period: BillingPeriod) => void;
  busy?: boolean;
}

function featureLabel(name: string, code: string): string {
  return name || code.replace(/^MODULE_/, '').replaceAll('_', ' ').toLowerCase();
}

export function PlanPicker({
  plans,
  current,
  provider,
  highlightFeature,
  onSelect,
  busy,
}: PlanPickerProps) {
  const [period, setPeriod] = useState<BillingPeriod>('MONTHLY');
  const checkoutEnabled = provider?.enabled === true;
  const afaCap = provider?.afaCapPaise;
  const sorted = plans.toSorted((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return (
    <section id="plans" className="space-y-4" data-testid="plan-picker">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Plans</h2>
          <p className="text-sm text-muted-foreground">
            Prices in Indian rupees. Recurring plans renew automatically with at least 24 hours notice before each charge.
          </p>
        </div>
        <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Billing period">
          {(['MONTHLY', 'ANNUAL'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={period === value ? 'default' : 'ghost'}
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
            >
              {value === 'MONTHLY' ? 'Monthly' : 'Yearly'}
            </Button>
          ))}
        </div>
      </div>

      {!checkoutEnabled && (
        <Alert data-testid="billing-not-configured">
          <AlertTitle>Billing not configured</AlertTitle>
          <AlertDescription>{BILLING_NOT_CONFIGURED_MESSAGE}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((plan) => {
          const isCurrent = current?.plan?.code === plan.code;
          const includesWanted = !!highlightFeature && planIncludesFeature(plan, highlightFeature);
          const price = period === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
          const aboveCap = price > 0 && exceedsAfaCap(plan, period, afaCap);
          const free = plan.monthlyPrice === 0 && plan.annualPrice === 0;
          return (
            <Card
              key={plan.code}
              data-testid={`plan-${plan.code}`}
              data-highlighted={includesWanted ? 'true' : undefined}
              className={cn(
                'flex flex-col',
                includesWanted && 'border-primary ring-2 ring-primary/40',
                isCurrent && 'bg-muted/40'
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent && <Badge variant="secondary">Current</Badge>}
                  {!isCurrent && includesWanted && <Badge>Includes this module</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2 text-2xl font-semibold">
                  {free ? 'Free' : formatRupees(price)}
                  {!free && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {period === 'ANNUAL' ? ' / year' : ' / month'}
                    </span>
                  )}
                </p>
                {plan.maxUsers !== null && (
                  <p className="text-xs text-muted-foreground">Up to {plan.maxUsers} users</p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-1.5 text-sm">
                  {plan.features
                    .filter((f) => f.enabled)
                    .map((f) => (
                      <li
                        key={f.featureCode}
                        className={cn(
                          'flex items-start gap-2',
                          highlightFeature === f.featureCode && 'font-medium text-primary'
                        )}
                      >
                        <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span className="capitalize">
                          {featureLabel(f.featureName, f.featureCode)}
                          {f.quotaLimit !== null && (
                            <span className="text-muted-foreground">
                              {' '}
                              ({f.quotaLimit}
                              {f.quotaPeriod ? ` / ${f.quotaPeriod.toLowerCase()}` : ''})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                </ul>
                {aboveCap && (
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-400" data-testid="afa-notice">
                    Above the 15,000 rupee auto-debit limit: each payment needs your approval.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={isCurrent || busy || (!free && !checkoutEnabled)}
                  onClick={() => onSelect(plan, period)}
                  title={!free && !checkoutEnabled ? BILLING_NOT_CONFIGURED_MESSAGE : undefined}
                >
                  {isCurrent ? 'Current plan' : free ? 'Choose free plan' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
