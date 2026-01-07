'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Wallet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
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
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBudgets.length);
  const paginatedBudgets = filteredBudgets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Statistics
  const totalBudget = mockBudgets.reduce((sum, b) => sum + b.totalAllocated, 0);
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.totalSpent, 0);
  const totalRemaining = mockBudgets.reduce(
    (sum, b) => sum + b.totalRemaining,
    0
  );
  const overBudgetCount = mockBudgets.filter((b) => b.isOverBudget).length;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage and track project and organization budgets
          </p>
        </div>
        <Button asChild>
          <Link href="/users/dashboard/finance/budgets/new">Create Budget</Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Allocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  ₹{(totalBudget / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  ₹{(totalSpent / 1_000_000).toFixed(1)}M
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {((totalSpent / totalBudget) * 100).toFixed(1)}% used
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  ₹{(totalRemaining / 1_000_000).toFixed(1)}M
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Available
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overBudgetCount}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Budgets exceeded
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by budget number, name, or description..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              ...Object.entries(budgetStatusLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              ...Object.entries(budgetTypeLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ],
            value: typeFilter,
            onChange: (value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {paginatedBudgets.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(endIndex, filteredBudgets.length)} of{' '}
          {filteredBudgets.length} budgets
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
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
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budgets Grid */}
      {paginatedBudgets.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paginatedBudgets.map((budget, idx) => (
                <Link
                  key={budget.id}
                  href={`/users/dashboard/finance/budgets/${budget.id}`}
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
                                <Badge className={getTypeColor(budget.type)}>
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
                            ₹{budget.totalAllocated.toLocaleString('en-IN')}
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
                            ₹{budget.totalRemaining.toLocaleString('en-IN')}
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
                            <span>{budget.percentageUsed.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
          {/* Pagination */}
          {paginatedBudgets.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <PieChart className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No budgets found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first budget'}
            </p>
            {!hasActiveFilters && (
              <Button asChild>
                <Link href="/users/dashboard/finance/budgets/new">
                  <PieChart className="mr-2 h-4 w-4" />
                  Create Budget
                </Link>
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
