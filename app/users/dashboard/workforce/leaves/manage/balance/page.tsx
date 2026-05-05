'use client';

import { useState } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { Button } from '@/components/shadcn/button';
import {
  useEmployeeBalanceSummary,
  useTransactionHistory,
} from '@/hooks/leave/use-leave';
import { Card } from '@/components/shadcn/card';
import { OrgGuard, PageHeader } from '@/components/common';
import { BalancesTabContent } from '@/features/leave/components/balances-tab-content';
import { TransactionsTabContent } from '@/features/leave/components/transactions-tab-content';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { format } from 'date-fns';

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BalanceDetailsPage() {
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id || 0;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState('balances');

  const { data: balanceSummary, isLoading: balanceLoading } =
    useEmployeeBalanceSummary(employeeId, Number.parseInt(selectedYear));
  const { data: transactions, isLoading: transactionsLoading } =
    useTransactionHistory(employeeId);

  const years = [currentYear, currentYear - 1, currentYear - 2].map((y) =>
    y.toString()
  );

  const totalAvailable = balanceSummary?.totalAvailable || 0;
  const totalUsed = balanceSummary?.totalUsed || 0;
  const totalPending = balanceSummary?.totalPending || 0;
  const totalAllocated =
    balanceSummary?.balances?.reduce(
      (sum, b) =>
        sum + (b.openingBalance + b.accrued + b.carryForwardFromPrevious),
      0
    ) || 0;

  const handleExport = () => {
    if (activeTab === 'balances') {
      const balances = balanceSummary?.balances ?? [];
      const header = [
        'Leave Type',
        'Opening',
        'Accrued',
        'Carry Forward',
        'Total',
        'Used',
        'Pending',
        'Available',
      ];
      const rows = balances.map((b) => {
        const total = b.openingBalance + b.accrued + b.carryForwardFromPrevious;
        return [
          b.leaveTypeName ?? '',
          b.openingBalance.toFixed(1),
          b.accrued.toFixed(1),
          b.carryForwardFromPrevious.toFixed(1),
          total.toFixed(1),
          b.used.toFixed(1),
          b.pending.toFixed(1),
          b.availableBalance.toFixed(1),
        ];
      });
      downloadCsv(`leave-balances-${selectedYear}.csv`, [header, ...rows]);
    } else {
      const txns = transactions ?? [];
      const header = [
        'Date',
        'Leave Type',
        'Transaction Type',
        'Amount',
        'Balance After',
        'Description',
      ];
      const rows = txns.map((tx) => [
        format(new Date(tx.transactionDate), 'yyyy-MM-dd'),
        tx.leaveTypeName ?? '',
        tx.transactionType.replaceAll('_', ' '),
        (tx.days > 0 ? '+' : '') + tx.days.toFixed(1),
        tx.balanceAfter.toFixed(1),
        tx.reason ?? '',
      ]);
      downloadCsv(`leave-transactions-${selectedYear}.csv`, [header, ...rows]);
    }
  };

  return (
    <OrgGuard
      isLoading={employeeLoading}
      error={null}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-4">
        <PageHeader
          title="Leave Balance"
          description="View your leave balances and transaction history"
        />

        <Card className="gap-0 p-6">
          <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            <div className="flex flex-col gap-1 sm:pr-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Total Allocated
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {totalAllocated.toFixed(1)}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Available
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {totalAvailable.toFixed(1)}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Used</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                  {totalUsed.toFixed(1)}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                  <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pending
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {totalPending.toFixed(1)}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="balances">Leave Balances</TabsTrigger>
              <TabsTrigger value="transactions">
                Transaction History
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export {activeTab === 'balances' ? 'Balances' : 'Transactions'}
            </Button>
          </div>

          <TabsContent value="balances" className="space-y-4">
            <BalancesTabContent
              balanceSummary={balanceSummary}
              isLoading={balanceLoading}
              selectedYear={selectedYear}
              years={years}
              onYearChange={setSelectedYear}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionsTabContent
              transactions={transactions}
              isLoading={transactionsLoading}
              selectedYear={selectedYear}
              years={years}
              onYearChange={setSelectedYear}
            />
          </TabsContent>
        </Tabs>
      </div>
    </OrgGuard>
  );
}
