'use client';

/**
 * Dashboard pieces whose endpoints are role-gated on the backend. Each is
 * mounted only for a reader the gate admits, so its query never runs (and
 * never 403s) for anyone else.
 */
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  IndianRupee,
  Package,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { useProfitAndLoss } from '@tornotron/echno-core/finance/hooks';
import { useOrganizationRequests } from '@tornotron/echno-core/leave/hooks';
import {
  useLowStockMaterials,
  useMaterialStockSummary,
} from '@tornotron/echno-core/materials/hooks';
import { LeaveStatus } from '@tornotron/echno-core/leave/types';
import { routes } from '@/nav';
import { formatDateMedium } from '@/lib/utils/date-utils';
import {
  expenseBreakdown,
  formatRupeesFull,
  formatRupeesShort,
  leaveDaysByType,
  percentChange,
  recentLeaveRequests,
  reportRanges,
} from '../lib/dashboard-metrics';
import {
  BreakdownBars,
  MetricTile,
  WidgetCard,
  WidgetEmpty,
  WidgetError,
  WidgetLoading,
} from './dashboard-widgets';

/** Income this month from the profit and loss report, against last month. */
export function IncomeStatCard() {
  const ranges = reportRanges();
  const current = useProfitAndLoss(ranges.thisMonth.from, ranges.thisMonth.to);
  const previous = useProfitAndLoss(ranges.lastMonth.from, ranges.lastMonth.to);

  const income = current.data?.totalIncome;
  const change = percentChange(income, previous.data?.totalIncome);

  let figure = '—';
  if (current.isLoading) figure = '…';
  else if (income !== undefined) figure = formatRupeesShort(income);

  let note = 'this month';
  if (current.isError) note = 'could not load';
  else if (income === 0) note = 'none recorded this month';

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium sm:text-base">
            Income
          </CardTitle>
          <IndianRupee className="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100"
          data-testid="income-figure"
        >
          {figure}
        </div>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
          {change === undefined ? (
            note
          ) : (
            <>
              <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {change >= 0 ? '+' : ''}
                {change}%
              </span>{' '}
              from last month
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

/** Income, expenses and the expense accounts over the last six months. */
export function FinanceSection() {
  const { lastSixMonths } = reportRanges();
  const pnl = useProfitAndLoss(lastSixMonths.from, lastSixMonths.to);
  const report = pnl.data;
  const hasActivity =
    !!report && (report.totalIncome !== 0 || report.totalExpense !== 0);
  const breakdown = report ? expenseBreakdown(report.expense) : [];
  const margin =
    report && report.totalIncome > 0
      ? Math.round((report.netProfit / report.totalIncome) * 1000) / 10
      : undefined;

  const body = (content: React.ReactNode) => {
    if (pnl.isLoading) return <WidgetLoading />;
    if (pnl.isError) return <WidgetError what="the profit and loss report" />;
    return content;
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <WidgetCard
        title="Financial Summary"
        description="Last six months, from posted journal entries"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.finance.journalEntries}>
              Journal <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      >
        {body(
          hasActivity && report ? (
            <div className="grid grid-cols-2 gap-4">
              <MetricTile
                icon={TrendingUp}
                label="Income"
                value={formatRupeesShort(report.totalIncome)}
              />
              <MetricTile
                icon={TrendingDown}
                label="Expenses"
                value={formatRupeesShort(report.totalExpense)}
              />
              <MetricTile
                icon={Wallet}
                label={report.netProfit >= 0 ? 'Net profit' : 'Net loss'}
                value={formatRupeesShort(Math.abs(report.netProfit))}
              />
              <MetricTile
                icon={PiggyBank}
                label="Profit margin"
                value={margin === undefined ? '—' : `${margin}%`}
                hint={margin === undefined ? 'No income yet' : undefined}
              />
            </div>
          ) : (
            <WidgetEmpty
              icon={Receipt}
              title="No finance activity yet"
              description="Income and expenses appear here once invoices, receipts or expenses are posted."
            />
          )
        )}
      </WidgetCard>

      <WidgetCard
        title="Expense Breakdown"
        description="By expense account, last six months (₹)"
      >
        {body(
          breakdown.length > 0 ? (
            <BreakdownBars items={breakdown} format={formatRupeesFull} />
          ) : (
            <WidgetEmpty
              icon={Receipt}
              title="No expenses yet"
              description="Posted expenses are grouped here by account."
            />
          )
        )}
      </WidgetCard>
    </div>
  );
}

const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  [LeaveStatus.DRAFT]: 'Draft',
  [LeaveStatus.PENDING_APPROVAL]: 'Pending',
  [LeaveStatus.APPROVED]: 'Approved',
  [LeaveStatus.REJECTED]: 'Rejected',
  [LeaveStatus.CANCELLED]: 'Cancelled',
  [LeaveStatus.WITHDRAWN]: 'Withdrawn',
};

const LEAVE_STATUS_CLASS: Partial<Record<LeaveStatus, string>> = {
  [LeaveStatus.PENDING_APPROVAL]:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  [LeaveStatus.APPROVED]:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [LeaveStatus.REJECTED]:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

/** The organization's recent leave requests and approved days by type. */
export function LeaveSection() {
  const { data: requests = [], isLoading, isError } = useOrganizationRequests();
  const recent = recentLeaveRequests(requests);
  const byType = leaveDaysByType(requests);

  const body = (content: React.ReactNode) => {
    if (isLoading) return <WidgetLoading />;
    if (isError) return <WidgetError what="leave requests" />;
    return content;
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <WidgetCard
        title="Recent Leave Requests"
        description="Latest requests across the organization"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.workforce.leaves.href}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      >
        {body(
          recent.length > 0 ? (
            <ul className="space-y-3">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {r.employeeName ?? `Employee #${r.employeeId}`}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {r.leaveTypeName ?? 'Leave'} ·{' '}
                      {formatDateMedium(r.startDate)} · {r.totalDays} day
                      {r.totalDays === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                      LEAVE_STATUS_CLASS[r.status] ??
                      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {LEAVE_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <WidgetEmpty
              title="No leave requests yet"
              description="Requests your employees submit show up here."
            />
          )
        )}
      </WidgetCard>

      <WidgetCard
        title="Leave Days by Type"
        description="Approved leave days, all requests on record"
      >
        {body(
          byType.length > 0 ? (
            <BreakdownBars
              items={byType}
              format={(d) => `${d} day${d === 1 ? '' : 's'}`}
            />
          ) : (
            <WidgetEmpty
              title="No approved leave yet"
              description="Approved leave is totalled here by leave type."
            />
          )
        )}
      </WidgetCard>
    </div>
  );
}

/** Material stock figures the server totals, and the low-stock count. */
export function InventorySection() {
  const summary = useMaterialStockSummary();
  const lowStock = useLowStockMaterials({ pageSize: 1 });
  const s = summary.data;

  let content: React.ReactNode;
  if (summary.isLoading) content = <WidgetLoading />;
  else if (summary.isError || !s)
    content = <WidgetError what="stock figures" />;
  else if (s.materialCount === 0)
    content = (
      <WidgetEmpty
        icon={Package}
        title="No materials yet"
        description="Add materials to the catalogue to track stock and its value."
      />
    );
  else
    content = (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile icon={Boxes} label="Materials" value={s.materialCount} />
        <MetricTile
          icon={IndianRupee}
          label="Stock value"
          value={formatRupeesShort(s.totalStockValue)}
          hint={
            s.unvaluedHoldingCount > 0
              ? `${s.unvaluedHoldingCount} holding${s.unvaluedHoldingCount === 1 ? '' : 's'} without a unit cost`
              : undefined
          }
        />
        <MetricTile
          icon={AlertTriangle}
          label="Below reorder level"
          value={
            lowStock.isLoading
              ? '…'
              : lowStock.isError
                ? '—'
                : (lowStock.data?.totalElements ?? 0)
          }
        />
        <MetricTile
          icon={Package}
          label="Units in use"
          value={s.distinctUnits}
        />
      </div>
    );

  return (
    <WidgetCard
      title="Inventory"
      description="Stock on hand across the organization"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.resources.materials.href}>
            Materials <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      }
    >
      {content}
    </WidgetCard>
  );
}
