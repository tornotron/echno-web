'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { mockBudgets, mockEmployees } from '@/components/shared/mock-data';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Separator } from '@/components/shadcn/separator';
import {
  Edit,
  Download,
  PieChart,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Wallet,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { format } from 'date-fns';
import {
  BudgetStatus,
  BudgetType,
  budgetStatusLabels,
  budgetTypeLabels,
  getBudgetHealth,
  budgetLineItemTypeLabels,
  PaymentMilestoneStatus,
  paymentMilestoneStatusLabels,
} from '@/types/finance/budget';

const getStatusColor = (status: BudgetStatus) => {
  switch (status) {
    case BudgetStatus.approved: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case BudgetStatus.active: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case BudgetStatus.underReview: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case BudgetStatus.draft: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case BudgetStatus.exceeded: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case BudgetStatus.closed: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case BudgetStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: BudgetType) => {
  switch (type) {
    case BudgetType.project: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case BudgetType.department: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case BudgetType.category: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    case BudgetType.organization: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case BudgetType.annual: {
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
    }
    case BudgetType.quarterly: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case BudgetType.monthly: {
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getMilestoneStatusColor = (status: PaymentMilestoneStatus) => {
  switch (status) {
    case PaymentMilestoneStatus.paid: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case PaymentMilestoneStatus.due: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case PaymentMilestoneStatus.overdue: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case PaymentMilestoneStatus.pending: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case PaymentMilestoneStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

interface BudgetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BudgetDetailPage({ params }: BudgetDetailPageProps) {
  const resolvedParams = use(params);
  const budget = mockBudgets.find(
    (b) => b.id === Number.parseInt(resolvedParams.id)
  );

  if (!budget) {
    notFound();
  }

  const preparedByEmployee = mockEmployees.find(
    (e) => e.id === budget.preparedBy
  );
  const approvedByEmployee = mockEmployees.find(
    (e) => e.id === budget.approvedBy
  );

  const budgetHealth = getBudgetHealth(budget.percentageUsed);
  const healthIconColor =
    budgetHealth.status === 'exceeded' || budgetHealth.status === 'critical'
      ? 'text-red-600 dark:text-red-400'
      : budgetHealth.status === 'warning'
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-green-600 dark:text-green-400';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600">
              <PieChart className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="mb-2 flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {budget.budgetNumber}
                </h1>
                <Badge className={getStatusColor(budget.status)}>
                  {budgetStatusLabels[budget.status]}
                </Badge>
                <Badge className={getTypeColor(budget.type)}>
                  {budgetTypeLabels[budget.type]}
                </Badge>
              </div>
              <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                {budget.name}
              </p>
              <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(budget.startDate, 'dd MMM yyyy')} -{' '}
                  {format(budget.endDate, 'dd MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Link href={routes.finance.budgets.detail(budget.id).edit}>
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
        {/* Left Column - Budget Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
              <CardDescription>
                Budget allocation and spending overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Allocated
                    </span>
                    <span className="font-medium">
                      ₹{budget.totalAllocated.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Spent
                    </span>
                    <span className="font-medium">
                      ₹{budget.totalSpent.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {budget.totalCommitted > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Total Committed
                      </span>
                      <span className="font-medium">
                        ₹{budget.totalCommitted.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">
                      Total Remaining
                    </span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      ₹{budget.totalRemaining.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Health */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Health</CardTitle>
            </CardHeader>
            <CardContent>
              {budget.percentageUsed > 100 || budget.percentageUsed >= 95 ? (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/20 dark:bg-red-900/10">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      {budget.percentageUsed > 100 ? 'Over Budget' : 'Critical'}
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {budget.percentageUsed.toFixed(1)}% of budget used
                      {budget.isOverBudget && budget.overBudgetAmount && (
                        <>
                          {' '}
                          (₹{budget.overBudgetAmount.toLocaleString(
                            'en-IN'
                          )}{' '}
                          over)
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : budget.percentageUsed >= 80 ? (
                <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/20 dark:bg-yellow-900/10">
                  <TrendingUp className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Warning
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {budget.percentageUsed.toFixed(1)}% of budget used
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/20 dark:bg-green-900/10">
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Healthy
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {budget.percentageUsed.toFixed(1)}% of budget used
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Line Items</CardTitle>
              <CardDescription>
                Detailed cost breakdown with quantities and rates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[150px]">Category</TableHead>
                      <TableHead className="min-w-[200px]">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        Qty
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        Rate (₹)
                      </TableHead>
                      <TableHead className="min-w-[140px] text-right">
                        Allocated (₹)
                      </TableHead>
                      <TableHead className="min-w-[140px] text-right">
                        Committed (₹)
                      </TableHead>
                      <TableHead className="min-w-[140px] text-right">
                        Spent (₹)
                      </TableHead>
                      <TableHead className="min-w-[140px] text-right">
                        Remaining (₹)
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        Usage %
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budget.lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {budgetLineItemTypeLabels[item.itemType]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>{item.category}</div>
                          {item.subcategory && (
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              {item.subcategory}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.quantity
                            ? `${item.quantity.toLocaleString()} ${item.unit || ''}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.unitRate
                            ? `₹${item.unitRate.toLocaleString('en-IN')}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{item.allocatedAmount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-sm text-blue-600 dark:text-blue-400">
                          {item.committedAmount > 0
                            ? `₹${item.committedAmount.toLocaleString('en-IN')}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          ₹{item.spentAmount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{item.remainingAmount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              item.percentageUsed >= 95
                                ? 'font-semibold text-red-600 dark:text-red-400'
                                : item.percentageUsed >= 80
                                  ? 'font-semibold text-yellow-600 dark:text-yellow-400'
                                  : 'font-semibold text-green-600 dark:text-green-400'
                            }
                          >
                            {item.percentageUsed.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          {(budget.projectScope || budget.assumptions || budget.exclusions) && (
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Scope, assumptions, and exclusions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {budget.projectScope && (
                  <>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Project Scope
                      </h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {budget.projectScope}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {budget.assumptions && (
                  <>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Assumptions
                      </h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {budget.assumptions}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {budget.exclusions && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Exclusions
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {budget.exclusions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Milestones */}
          {budget.paymentMilestones && budget.paymentMilestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Milestones</CardTitle>
                <CardDescription>
                  Scheduled payments and progress tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="min-w-[150px]">
                          Milestone
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Due Date
                        </TableHead>
                        <TableHead className="min-w-[120px] text-right">
                          Amount (₹)
                        </TableHead>
                        <TableHead className="min-w-[80px] text-right">
                          %
                        </TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budget.paymentMilestones.map((milestone) => (
                        <TableRow key={milestone.id}>
                          <TableCell>
                            <div className="font-medium">{milestone.name}</div>
                            {milestone.description && (
                              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                {milestone.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(milestone.dueDate, 'dd MMM yyyy')}
                            {milestone.paidDate && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Paid:{' '}
                                {format(milestone.paidDate, 'dd MMM yyyy')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{milestone.amount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {milestone.percentage}%
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getMilestoneStatusColor(
                                milestone.status
                              )}
                            >
                              {paymentMilestoneStatusLabels[milestone.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          {budget.termsAndConditions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {budget.termsAndConditions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Budget Information */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Information</CardTitle>
              <CardDescription>Details about this budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budget.description && (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Description
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {budget.description}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <Wallet className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Fiscal Year
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {budget.fiscalYear || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Approval and Status */}
        <div className="space-y-6">
          {/* Preparation Information */}
          <Card>
            <CardHeader>
              <CardTitle>Preparation</CardTitle>
              <CardDescription>Budget preparation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Prepared By</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {format(budget.preparedAt, 'dd MMM yyyy, hh:mm a')}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    By{' '}
                    <Link
                      href={
                        routes.workforce.employees.employeeManagement.detail(
                          budget.preparedBy
                        ).href
                      }
                      className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {preparedByEmployee?.name ||
                        `Employee #${budget.preparedBy}`}
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Information */}
          {budget.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle>Approval</CardTitle>
                <CardDescription>Budget approval details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Approved By</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {budget.approvedAt
                        ? format(budget.approvedAt, 'dd MMM yyyy, hh:mm a')
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      By{' '}
                      <Link
                        href={
                          routes.workforce.employees.employeeManagement.detail(
                            budget.approvedBy
                          ).href
                        }
                        className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {approvedByEmployee?.name ||
                          `Employee #${budget.approvedBy}`}
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Usage Rate
                </p>
                <p className={`font-semibold ${healthIconColor}`}>
                  {budget.percentageUsed.toFixed(1)}%
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Budget Status
                </p>
                <Badge className={getStatusColor(budget.status)}>
                  {budgetStatusLabels[budget.status]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Warning Threshold
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {budget.warningThreshold}%
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Critical Threshold
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {budget.criticalThreshold}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
