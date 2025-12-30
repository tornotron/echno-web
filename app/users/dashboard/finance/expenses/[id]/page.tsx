'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { mockExpenses, mockEmployees } from '@/components/shared/mock-data';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Download,
  DollarSign,
  Calendar,
  Building,
  Hash,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ExpenseType,
  ExpenseStatus,
  ExpenseCategory,
} from '@/types/finance/expense';

const expenseTypeLabels: Record<string, string> = {
  direct: 'Direct',
  indirect: 'Indirect',
  capital: 'Capital',
  operational: 'Operational',
};

const expenseStatusLabels: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  reimbursed: 'Reimbursed',
  cancelled: 'Cancelled',
};

const expenseCategoryLabels: Record<string, string> = {
  materials: 'Materials',
  labour: 'Labour',
  equipment: 'Equipment',
  transport: 'Transport',
  utilities: 'Utilities',
  rent: 'Rent',
  salaries: 'Salaries',
  maintenance: 'Maintenance',
  insurance: 'Insurance',
  legal: 'Legal',
  marketing: 'Marketing',
  office: 'Office',
  travel: 'Travel',
  miscellaneous: 'Miscellaneous',
  other: 'Other',
};

const getStatusColor = (status: ExpenseStatus) => {
  switch (status) {
    case ExpenseStatus.paid:
    case ExpenseStatus.reimbursed: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ExpenseStatus.approved: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ExpenseStatus.pending: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case ExpenseStatus.draft: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case ExpenseStatus.rejected: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case ExpenseStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: ExpenseType) => {
  switch (type) {
    case ExpenseType.direct: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ExpenseType.indirect: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case ExpenseType.capital: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ExpenseType.operational: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

interface ExpenseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const resolvedParams = use(params);
  const expense = mockExpenses.find(
    (e) => e.id === Number.parseInt(resolvedParams.id)
  );

  if (!expense) {
    notFound();
  }

  const submittedByEmployee = mockEmployees.find(
    (e) => e.id === expense.submittedBy
  );
  const approvedByEmployee = mockEmployees.find(
    (e) => e.id === expense.approvedBy
  );

  const paymentStatusColor =
    expense.paymentStatus === 'paid' || expense.paymentStatus === 'reimbursed'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="mb-2 flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {expense.expenseNumber}
                  </h1>
                  <Badge className={getStatusColor(expense.status)}>
                    {expenseStatusLabels[expense.status]}
                  </Badge>
                  <Badge className={getTypeColor(expense.type)}>
                    {expenseTypeLabels[expense.type]}
                  </Badge>
                </div>
                <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                  {expense.description}
                </p>
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    On {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Link
                href={`/users/dashboard/finance/expenses/${expense.id}/edit`}
              >
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Expense Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Amount Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Amount</CardTitle>
                <CardDescription>Transaction amount details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Amount
                      </span>
                      <span className="font-medium">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {expense.taxAmount !== undefined &&
                      expense.taxAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Tax ({expense.taxRate}%)
                            </span>
                            <span className="font-medium">
                              ₹{expense.taxAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </>
                      )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        ₹{expense.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Information */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Information</CardTitle>
                <CardDescription>Details about the expense</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Category
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {expenseCategoryLabels[expense.category]}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Expense Date
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Hash className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Payment Method
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {expense.paymentMethod || 'Not specified'}
                    </p>
                  </div>
                </div>
                {expense.billNumber && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Bill Number
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {expense.billNumber}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {expense.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Notes and remarks</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {expense.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Approval and Status */}
          <div className="space-y-6">
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {(expense.paymentStatus === 'unpaid' ||
                  expense.paymentStatus === 'partially_paid') && (
                  <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/20 dark:bg-orange-900/10">
                    <AlertCircle className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        Outstanding Balance
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        ₹{expense.balanceAmount.toLocaleString('en-IN')} pending
                        payment
                      </p>
                    </div>
                  </div>
                )}
                {(expense.paymentStatus === 'paid' ||
                  expense.paymentStatus === 'reimbursed') && (
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/20 dark:bg-green-900/10">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        {expense.paymentStatus === 'reimbursed'
                          ? 'Reimbursed'
                          : 'Fully Paid'}
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        This expense has been fully settled
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Information */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
                <CardDescription>Status and timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {format(
                        new Date(expense.submittedAt),
                        'dd MMM yyyy, hh:mm a'
                      )}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      By{' '}
                      <Link
                        href={`/users/dashboard/workforce/employees/${expense.submittedBy}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {submittedByEmployee?.name ||
                          `Employee #${expense.submittedBy}`}
                      </Link>
                    </p>
                  </div>
                </div>

                {expense.approvedBy && (
                  <>
                    <Separator />
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Approved</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {expense.approvedAt
                            ? format(
                                new Date(expense.approvedAt),
                                'dd MMM yyyy, hh:mm a'
                              )
                            : 'N/A'}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          By{' '}
                          <Link
                            href={`/users/dashboard/workforce/employees/${expense.approvedBy}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {approvedByEmployee?.name ||
                              `Employee #${expense.approvedBy}`}
                          </Link>
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {expense.rejectedBy && (
                  <>
                    <Separator />
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Rejected</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          By{' '}
                          <Link
                            href={`/users/dashboard/workforce/employees/${expense.rejectedBy}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Employee #{expense.rejectedBy}
                          </Link>
                        </p>
                        {expense.rejectionReason && (
                          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                            Reason: {expense.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Activity history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {format(
                          new Date(expense.createdAt),
                          'dd MMM yyyy, hh:mm a'
                        )}
                      </p>
                    </div>
                  </div>
                  {expense.createdAt.getTime() !==
                    expense.updatedAt.getTime() && (
                    <>
                      <Separator />
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {format(
                              new Date(expense.updatedAt),
                              'dd MMM yyyy, hh:mm a'
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
