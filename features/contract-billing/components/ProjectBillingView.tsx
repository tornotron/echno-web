'use client';

import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useBillingProject } from '@tornotron/echno-core/contract-billing/hooks';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Skeleton } from '@/components/shadcn/skeleton';
import { routes } from '@/nav';
import { formatInr, formatPercent } from '../lib/format';
import { projectLocation } from '../lib/projects';
import { BillingActivityCard } from './BillingActivityCard';
import { ProjectStateChip } from './chips';
import { ContractsTable } from './ContractsTable';
import { PaymentAuthorizerCard } from './PaymentAuthorizerCard';

/** One project's billing: its figures, its contracts and what happened lately. */
export function ProjectBillingView({ projectId }: { projectId: number }) {
  const { data, isPending, isError, error } = useBillingProject(projectId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <Building2 className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Could not load the project</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const figures = [
    { label: 'Contract value', value: formatInr(data.contractValue) },
    {
      label: 'Certified to date',
      value: formatInr(data.certifiedToDate),
      hint: `${formatPercent(data.billedPercent)} of the contract value`,
    },
    {
      label: 'Paid to date',
      value: formatInr(data.paidToDate),
      hint: `of ${formatInr(data.netApprovedToDate)} net approved`,
    },
    {
      label: 'Amount due',
      value: formatInr(data.amountDue),
      hint: `${data.openBills} open, ${data.awaitingSignature} awaiting signature`,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={data.projectName}
        description={projectLocation(data) || undefined}
        badge={<ProjectStateChip state={data.billingState} />}
        actions={
          <Button asChild variant="outline">
            <Link href={routes.inspections.billing.href}>
              <ArrowLeft className="size-4" />
              Billing
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {figures.map((figure) => (
          <Card key={figure.label} className="gap-1 py-3">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs">{figure.label}</p>
              <p className="truncate text-lg font-semibold">{figure.value}</p>
              {figure.hint && (
                <p className="text-muted-foreground text-xs">{figure.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ContractsTable projectId={projectId} />
        <div className="space-y-4">
          <PaymentAuthorizerCard projectId={projectId} />
          <BillingActivityCard projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
