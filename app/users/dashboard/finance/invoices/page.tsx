'use client';

import { useInvoices } from '@/hooks/invoices';
import { useProjects } from '@/hooks/project/use-projects';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { InvoiceStatus } from '@/types/finance/invoice';
import { InvoicesFeature } from '@/features/invoices';

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, isError } = useInvoices();
  const { data: projects = [] } = useProjects();

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(
    (i) => i.status === InvoiceStatus.paid
  ).length;
  const pendingInvoices = invoices.filter(
    (i) => i.status === InvoiceStatus.pending || i.status === InvoiceStatus.sent
  ).length;
  const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage invoices, track payments, and monitor outstanding balances"
        actions={
          <Button asChild>
            <Link href={routes.finance.invoices.new}>New Invoice</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Invoices
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalInvoices}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileText className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Paid</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {paidInvoices}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              fully settled
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pending / Sent
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {pendingInvoices}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting payment
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAmount / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <DollarSign className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              all invoices
            </p>
          </div>
        </div>
      </Card>

      <InvoicesFeature
        invoices={invoices}
        projects={projects}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
