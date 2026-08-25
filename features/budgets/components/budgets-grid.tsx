'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Pagination } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { PieChart, Search, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import {
  Budget,
  budgetStatusLabels,
  budgetTypeLabels,
} from '@/types/finance/budget';
import { BudgetCard } from './budget-card';

export interface BudgetsGridProps {
  budgets: Budget[];
  isLoading: boolean;
  isError: boolean;
}

export function BudgetsGrid({ budgets, isLoading, isError }: BudgetsGridProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesSearch =
        budget.budgetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || budget.status === statusFilter;
      const matchesType = typeFilter === 'all' || budget.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [budgets, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBudgets.length);
  const paginatedBudgets = filteredBudgets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  return (
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
        {/* Rows per page */}
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
                  {paginatedBudgets.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
                      onClick={() =>
                        router.push(
                          routes.finance.budgets.detail(budget.id).href
                        )
                      }
                    />
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
  );
}
