'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useEmployeeBalanceSummary,
  useTransactionHistory,
} from '@/hooks/leave/use-leave';
import { TransactionType } from '@/types/leave';
import { StatCard } from '@/components/leave/stat-card';
import { TableSkeleton } from '@/components/leave/skeletons';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUserEmployee } from '@/hooks/employee';

const getTransactionIcon = (type: TransactionType) => {
  switch (type) {
    case TransactionType.ACCRUAL:
    case TransactionType.CARRY_FORWARD:
    case TransactionType.ADJUSTMENT: {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    case TransactionType.DEDUCTION:
    case TransactionType.EXPIRY: {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    default: {
      return <FileText className="text-muted-foreground h-4 w-4" />;
    }
  }
};

const getTransactionColor = (type: TransactionType) => {
  switch (type) {
    case TransactionType.ACCRUAL:
    case TransactionType.CARRY_FORWARD: {
      return 'text-green-600';
    }
    case TransactionType.DEDUCTION:
    case TransactionType.EXPIRY: {
      return 'text-red-600';
    }
    case TransactionType.ADJUSTMENT: {
      return 'text-blue-600';
    }
    default: {
      return 'text-zinc-600';
    }
  }
};

export default function BalanceDetailsPage() {
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id || 0;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: balanceSummary, isLoading: balanceLoading } =
    useEmployeeBalanceSummary(employeeId, Number.parseInt(selectedYear));
  const { data: transactions, isLoading: transactionsLoading } =
    useTransactionHistory(employeeId);

  const years = [currentYear, currentYear - 1, currentYear - 2].map((y) =>
    y.toString()
  );

  // Calculate totals
  const totalAvailable = balanceSummary?.totalAvailable || 0;
  const totalUsed = balanceSummary?.totalUsed || 0;
  const totalPending = balanceSummary?.totalPending || 0;
  const totalAllocated =
    balanceSummary?.balances?.reduce(
      (sum, b) =>
        sum + (b.openingBalance + b.accrued + b.carryForwardFromPrevious),
      0
    ) || 0;

  if (employeeLoading) {
    return <TableSkeleton />;
  }

  if (!employee) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">
          Employee Profile Not Found
        </h2>
        <p className="text-zinc-500">
          Please ensure your employee profile is set up correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Leave Balance
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            View your leave balances and transaction history
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Total Allocated"
          value={totalAllocated.toFixed(1)}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Available"
          value={totalAvailable.toFixed(1)}
          color="green"
        />
        <StatCard
          icon={TrendingDown}
          label="Used"
          value={totalUsed.toFixed(1)}
          color="red"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={totalPending.toFixed(1)}
          color="yellow"
        />
      </div>

      <Tabs defaultValue="balances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          {balanceLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : balanceSummary && balanceSummary.balances.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:hidden">
                {balanceSummary.balances.map((balance) => {
                  const total =
                    balance.openingBalance +
                    balance.accrued +
                    balance.carryForwardFromPrevious;
                  const usagePercent =
                    total > 0 ? (balance.used / total) * 100 : 0;

                  return (
                    <Card key={balance.id}>
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {balance.leaveTypeName}
                          </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {balance.availableBalance.toFixed(1)}
                          </span>
                        </div>
                        <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400">
                              Total
                            </p>
                            <p className="font-semibold">{total.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400">
                              Used
                            </p>
                            <p className="font-semibold text-red-600 dark:text-red-400">
                              {balance.used.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400">
                              Pending
                            </p>
                            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                              {balance.pending.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={usagePercent}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {usagePercent.toFixed(0)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <Card className="hidden lg:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Opening</TableHead>
                        <TableHead>Accrued</TableHead>
                        <TableHead>Carry Forward</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Usage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSummary.balances.map((balance) => {
                        const total =
                          balance.openingBalance +
                          balance.accrued +
                          balance.carryForwardFromPrevious;
                        const usagePercent =
                          total > 0 ? (balance.used / total) * 100 : 0;

                        return (
                          <TableRow
                            key={balance.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {balance.leaveTypeName}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {balance.openingBalance.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-600 dark:text-green-400">
                                +{balance.accrued.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-blue-600 dark:text-blue-400">
                                {balance.carryForwardFromPrevious > 0
                                  ? `+${balance.carryForwardFromPrevious.toFixed(1)}`
                                  : '0.0'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {total.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-red-600 dark:text-red-400">
                                {balance.used.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-yellow-600 dark:text-yellow-400">
                                {balance.pending.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {balance.availableBalance.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-[120px] items-center gap-2">
                                <Progress
                                  value={usagePercent}
                                  className="h-2 flex-1"
                                />
                                <span className="min-w-[40px] text-xs text-zinc-600 dark:text-zinc-400">
                                  {usagePercent.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  No leave balance found
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  No leave balances are available for the selected year
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {transactionsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : transactions && transactions.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:hidden">
                {transactions.slice(0, 50).map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transactionType)}
                          <Badge variant="outline" className="text-xs">
                            {transaction.transactionType.replaceAll('_', ' ')}
                          </Badge>
                        </div>
                        <span
                          className={`font-semibold ${getTransactionColor(transaction.transactionType)}`}
                        >
                          {transaction.days > 0 ? '+' : ''}
                          {transaction.days.toFixed(1)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {transaction.leaveTypeName || '-'}
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            Bal: {transaction.balanceAfter.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {format(
                            new Date(transaction.transactionDate),
                            'MMM dd, yyyy'
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <Card className="hidden lg:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 50).map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {format(
                                new Date(transaction.transactionDate),
                                'MMM dd, yyyy'
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {transaction.leaveTypeName || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.transactionType)}
                              <Badge variant="outline">
                                {transaction.transactionType.replaceAll(
                                  '_',
                                  ' '
                                )}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${getTransactionColor(transaction.transactionType)}`}
                            >
                              {transaction.days > 0 ? '+' : ''}
                              {transaction.days.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {transaction.balanceAfter.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {transaction.reason || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  No transactions found
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  No transaction history is available
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
