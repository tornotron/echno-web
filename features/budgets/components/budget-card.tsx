'use client';

import { Badge } from '@/components/shadcn/badge';
import { PieChart, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Budget,
  BudgetType,
  BudgetStatus,
  budgetStatusLabels,
  budgetTypeLabels,
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

const getHealthColor = (percentageUsed: number) => {
  if (percentageUsed > 100 || percentageUsed >= 95) {
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

export interface BudgetCardProps {
  budget: Budget;
  onClick: () => void;
}

export function BudgetCard({ budget, onClick }: BudgetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          onClick();
        } else if (e.key === 'Enter') {
          onClick();
        }
      }}
    >
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
  );
}
