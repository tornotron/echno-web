'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Pagination, PageHeader } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  PieChart,
  Wallet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  Search,
  Loader2,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { mockBudgets } from '@/components/shared/mock-data';
import {
  BudgetStatus,
  BudgetType,
  budgetStatusLabels,
  budgetTypeLabels,
} from '@/types/finance/budget';
import { format } from 'date-fns';

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

const getHealthColor = (percentageUsed: number) => {
  if (percentageUsed > 100) {
    return 'text-red-600 dark:text-red-400';
  } else if (percentageUsed >= 95) {
    return 'text-red-600 dark:text-red-400';
  } else if (percentageUsed >= 80) {
    return 'text-yellow-600 dark:text-yellow-400';
  } else {
    return 'text-green-600 dark:text-green-400';
  }
};

const getHealthIcon = (percentageUsed: number) => {
  if (percentageUsed > 100 || percentageUsed >= 95) {
    return <AlertTriangle className="h-4 w-4" />;
  } else if (percentageUsed >= 80) {
    return <TrendingUp className="h-4 w-4" />;
  } else {
    return <CheckCircle className="h-4 w-4" />;
  }
};

export default function BudgetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBudgets = useMemo(() => {
    return mockBudgets.filter((budget) => {
      const matchesSearch =
        budget.budgetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || budget.status === statusFilter;
      const matchesType = typeFilter === 'all' || budget.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBudgets.length);
  const paginatedBudgets = filteredBudgets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Statistics
  const totalBudgetsCount = mockBudgets.length;
  const activeBudgets = mockBudgets.filter(
    (b) =>
      b.status === BudgetStatus.active || b.status === BudgetStatus.approved
  ).length;
  const atRiskOrExceeded = mockBudgets.filter(
    (b) => b.isOverBudget || b.percentageUsed >= 80
  ).length;
  const totalAllocated = mockBudgets.reduce(
    (sum, b) => sum + b.totalAllocated,
    0
  );

  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Manage and track project and organization budgets"
        actions={
          <Button asChild>
            <Link href={routes.finance.budgets.new}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Budgets
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalBudgetsCount}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <PieChart className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Active</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {activeBudgets}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              currently active
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Exceeded / At Risk
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {atRiskOrExceeded}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              over budget
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Allocated
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAllocated / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Wallet className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              all budgets
            </p>
          </div>
        </div>
      </Card>

      {/* Unified Card: search/filter toolbar + content + pagination */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          {/* Search input */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by budget number, name, or description..."
              className="h-8 pl-8 text-sm"
            />
          </div>
          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(budgetStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Type filter */}
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(budgetTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Rows per page — pushed to right */}
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {(() => {
            const isLoading = false;
            const isError = false;
            if (isLoading)
              return (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              );
            if (isError)
              return (
                <CardContent>
                  <Empty variant="default">
                    <EmptyErrorMedia>
                      <PieChart className="size-6" />
                    </EmptyErrorMedia>
                    <EmptyHeader>
                      <EmptyTitle>Failed to load budgets</EmptyTitle>
                      <EmptyDescription>
                        An unexpected error occurred. Please try again.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              );
            if (paginatedBudgets.length > 0)
              return (
                <div className="p-6">
                  <div className="space-y-4">
                    {paginatedBudgets.map((budget, idx) => (
                      <Link
                        key={budget.id}
                        href={routes.finance.budgets.detail(budget.id).href}
                        className={`block${idx === paginatedBudgets.length - 1 ? 'mb-2' : ''}`}
                      >
                        <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            {/* Left: Budget Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-orange-600">
                                  <PieChart className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                      {budget.name}
                                    </h3>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                      {budget.budgetNumber}
                                    </span>
                                  </div>
                                  {budget.description && (
                                    <p className="mt-1 line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">
                                      {budget.description}
                                    </p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-4">
                                    <div className="flex items-center text-xs text-zinc-500">
                                      <span>Period:</span>
                                      <span className="ml-1">
                                        {format(budget.startDate, 'MMM dd')} -{' '}
                                        {format(budget.endDate, 'MMM dd, yy')}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs text-zinc-500">
                                      <Badge
                                        className={getTypeColor(budget.type)}
                                      >
                                        {budgetTypeLabels[budget.type]}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Status */}
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(budget.status)}>
                                {budgetStatusLabels[budget.status]}
                              </Badge>
                            </div>

                            {/* Right: Metrics */}
                            <div className="grid grid-cols-2 gap-4 lg:w-auto lg:grid-cols-4">
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Allocated
                                </div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  ₹
                                  {budget.totalAllocated.toLocaleString(
                                    'en-IN'
                                  )}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Spent
                                </div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  ₹{budget.totalSpent.toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Remaining
                                </div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  ₹
                                  {budget.totalRemaining.toLocaleString(
                                    'en-IN'
                                  )}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Usage
                                </div>
                                <div
                                  className={`flex items-center justify-center gap-2 ${getHealthColor(budget.percentageUsed)}`}
                                >
                                  {getHealthIcon(budget.percentageUsed)}
                                  <span>
                                    {budget.percentageUsed.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            return (
              <CardContent>
                <Empty variant="default">
                  <EmptyMedia variant="icon">
                    <PieChart className="size-6" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No budgets found</EmptyTitle>
                    <EmptyDescription>
                      {hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Add your first budget to get started.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  {!hasActiveFilters && (
                    <Button asChild>
                      <Link href={routes.finance.budgets.new}>New Budget</Link>
                    </Button>
                  )}
                </Empty>
              </CardContent>
            );
          })()}
        </CardContent>

        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-sm text-zinc-500">
            {filteredBudgets.length === 0
              ? '0 records'
              : `${startIndex + 1}–${Math.min(endIndex, filteredBudgets.length)} of ${filteredBudgets.length} ${filteredBudgets.length === 1 ? 'budget' : 'budgets'}`}
          </span>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>
    </div>
  );
}
