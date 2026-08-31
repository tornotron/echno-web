'use client';

import { useMemo } from 'react';
import { useVendors } from '@tornotron/echno-core/vendor/hooks';
import { usePayments } from '@/hooks/payments';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { useLabour } from '@tornotron/echno-core/labour/hooks';
import { useSubContracts } from '@/hooks/sub-contracts';
import { PageHeader, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { CreditCard, DollarSign, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { ConstructionPaymentVoucherStatus } from '@/types/finance/payment';
import { PaymentsTable } from '@/features/payments';

export default function PaymentsPage() {
  const { data: vendors = [] } = useVendors();
  const { data: payments = [], isLoading, isError } = usePayments();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const { data: subContracts = [] } = useSubContracts();
  const { data: labour = [] } = useLabour();

  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();
  const filteredPayments =
    employeeId != null && role
      ? payments.filter((r) =>
          rowMatchesEmployeeFilter(r, employeeId, role, {
            // Two ids of different kinds on one row. `verifier` reads a user
            // id the backend stamps from the session; `payee` reads the
            // employee id the creation payload names. The link that sets each
            // filter uses the matching helper, so the comparison is
            // like-for-like either way.
            verifier: (p) => p.verifiedBy,
            payee: (p) => p.employeeId,
          })
        )
      : payments;

  const payeeDatasets = useMemo(
    () => ({
      vendors,
      employees,
      subContracts,
      labour,
    }),
    [vendors, employees, subContracts, labour]
  );

  const projectById = useMemo(() => {
    const m = new Map<number, { projectName: string }>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const totalPayments = payments.length;
  const completedPayments = payments.filter(
    (p) => p.status === ConstructionPaymentVoucherStatus.COMPLETED
  ).length;
  const pendingPayments = payments.filter(
    (p) => p.status === ConstructionPaymentVoucherStatus.PENDING
  ).length;
  const totalAmount = payments
    .filter((p) => p.status === ConstructionPaymentVoucherStatus.COMPLETED)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Payments"
        description="Track and manage all financial payments"
        actions={
          <Button asChild>
            <Link href={routes.finance.payments.new}>New Payment</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Payments
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalPayments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <CreditCard className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Completed
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {completedPayments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              successfully paid
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {pendingPayments}
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
              Total Amount
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
              completed
            </p>
          </div>
        </div>
      </Card>

      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}

      <PaymentsTable
        payments={filteredPayments}
        isLoading={isLoading}
        isError={isError}
        payeeDatasets={payeeDatasets}
        projectById={projectById}
      />
    </div>
  );
}
