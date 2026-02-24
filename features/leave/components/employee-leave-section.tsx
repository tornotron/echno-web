'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/common';
import { Calendar, Loader2, Settings2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  useEmployeeBalances,
  useTransactionHistory,
} from '@/hooks/leave/use-leave';
import { TransactionType } from '@/types/leave';
import { BalanceAdjustmentDialog } from './balance-adjustment-dialog';

interface EmployeeLeaveSectionProps {
  employeeId: number;
  currentUserId: number;
}

const getTransactionColor = (type: TransactionType) => {
  switch (type) {
    case TransactionType.ACCRUAL:
    case TransactionType.CARRY_FORWARD:
    case TransactionType.OPENING_BALANCE: {
      return 'text-green-600';
    }
    case TransactionType.DEDUCTION:
    case TransactionType.EXPIRY: {
      return 'text-red-600';
    }
    case TransactionType.ADJUSTMENT: {
      return 'text-blue-600';
    }
    case TransactionType.REVERSAL: {
      return 'text-orange-600';
    }
    default: {
      return 'text-muted-foreground';
    }
  }
};

const getTransactionBadgeVariant = (
  type: TransactionType
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (type) {
    case TransactionType.ACCRUAL:
    case TransactionType.CARRY_FORWARD:
    case TransactionType.OPENING_BALANCE: {
      return 'default';
    }
    case TransactionType.DEDUCTION:
    case TransactionType.EXPIRY: {
      return 'destructive';
    }
    case TransactionType.ADJUSTMENT: {
      return 'secondary';
    }
    default: {
      return 'outline';
    }
  }
};

export function EmployeeLeaveSection({
  employeeId,
  currentUserId,
}: EmployeeLeaveSectionProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txPerPage, setTxPerPage] = useState(10);

  const { data: balances, isLoading: balanceLoading } = useEmployeeBalances(
    employeeId,
    Number.parseInt(selectedYear)
  );
  const { data: transactions, isLoading: transactionsLoading } =
    useTransactionHistory(employeeId);

  const years = [currentYear, currentYear - 1, currentYear - 2].map((y) =>
    y.toString()
  );

  if (balanceLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Balance
              </CardTitle>
              <CardDescription>Employee leave balance overview</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustOpen(true)}
              >
                <Settings2 className="mr-1.5 h-4 w-4" />
                Adjust
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balances && balances.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {balances.map((balance) => {
                const total =
                  balance.openingBalance +
                  balance.accrued +
                  balance.carryForwardFromPrevious;
                const usagePercent =
                  total > 0 ? (balance.used / total) * 100 : 0;

                return (
                  <div
                    key={balance.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">
                        {balance.leaveTypeName}
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {balance.availableBalance.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={usagePercent} className="h-2 flex-1" />
                      <span className="text-muted-foreground text-xs">
                        {usagePercent.toFixed(0)}% used
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Opening</p>
                        <p className="font-semibold">
                          {balance.openingBalance.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Accrued</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          +{balance.accrued.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carry Forward</p>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                          {balance.carryForwardFromPrevious > 0
                            ? `+${balance.carryForwardFromPrevious.toFixed(1)}`
                            : '0.0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Used</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {balance.used.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                          {balance.pending.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bookable</p>
                        <p className="font-semibold">
                          {balance.bookableBalance.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>No leave balance found for {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>Balance changes and adjustments</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {(txPage - 1) * txPerPage + 1} to{' '}
                  {Math.min(txPage * txPerPage, transactions.length)} of{' '}
                  {transactions.length} transactions
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground text-sm">
                    Rows per page:
                  </span>
                  <Select
                    value={txPerPage.toString()}
                    onValueChange={(value) => {
                      setTxPerPage(Number(value));
                      setTxPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-3 lg:hidden">
                {transactions
                  .slice((txPage - 1) * txPerPage, txPage * txPerPage)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-start justify-between gap-2 rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getTransactionBadgeVariant(
                              tx.transactionType
                            )}
                          >
                            {tx.transactionType.replaceAll('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {tx.leaveTypeName || '-'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(tx.transactionDate), 'MMM dd, yyyy')}
                        </p>
                        {tx.reason && (
                          <p className="text-muted-foreground text-xs">
                            {tx.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-semibold ${getTransactionColor(tx.transactionType)}`}
                        >
                          {tx.days > 0 ? '+' : ''}
                          {tx.days.toFixed(1)}
                        </span>
                        <p className="text-muted-foreground text-xs">
                          Bal: {tx.balanceAfter.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Desktop Table */}
              <Card className="hidden lg:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Before</TableHead>
                        <TableHead>After</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .slice((txPage - 1) * txPerPage, txPage * txPerPage)
                        .map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(
                                new Date(tx.transactionDate),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {tx.leaveTypeName || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getTransactionBadgeVariant(
                                  tx.transactionType
                                )}
                              >
                                {tx.transactionType.replaceAll('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${getTransactionColor(tx.transactionType)}`}
                              >
                                {tx.days > 0 ? '+' : ''}
                                {tx.days.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {tx.balanceBefore.toFixed(1)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {tx.balanceAfter.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                              {tx.reason || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination */}
              <Pagination
                currentPage={txPage}
                totalPages={Math.ceil(transactions.length / txPerPage)}
                onPageChange={setTxPage}
              />
            </>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>No transaction history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Adjustment Dialog */}
      {balances && (
        <BalanceAdjustmentDialog
          open={isAdjustOpen}
          onOpenChange={setIsAdjustOpen}
          employeeId={employeeId}
          adjustedById={currentUserId}
          balances={balances}
        />
      )}
    </div>
  );
}
