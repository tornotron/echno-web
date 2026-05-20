'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Pagination, SearchAndFilter, PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  invoiceTypeLabels,
  invoiceStatusLabels,
} from '@/types/finance/invoice';
import { Project } from '@/types/project';

const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.paid: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case InvoiceStatus.partiallyPaid: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case InvoiceStatus.pending: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case InvoiceStatus.sent: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case InvoiceStatus.draft: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case InvoiceStatus.overdue: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case InvoiceStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case InvoiceStatus.disputed: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: InvoiceType) => {
  switch (type) {
    case InvoiceType.purchase: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case InvoiceType.sales: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case InvoiceType.expense: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case InvoiceType.service: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

interface InvoicesFeatureProps {
  invoices: Invoice[];
  projects: Project[];
}

export function InvoicesFeature({ invoices, projects }: InvoicesFeatureProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter invoices based on search and filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.notes?.toLowerCase().includes(searchLower) ||
        invoice.paymentTerms?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || invoice.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || invoice.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [invoices, searchQuery, statusFilter, typeFilter]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Calculate stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(
    (i) => i.status === InvoiceStatus.paid
  ).length;
  const pendingInvoices = invoices.filter(
    (i) => i.status === InvoiceStatus.pending || i.status === InvoiceStatus.sent
  ).length;
  const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedInvoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected =
    paginatedInvoices.length > 0 &&
    paginatedInvoices.every((invoice) => selectedIds.includes(invoice.id));

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  // Helper to get project name
  const getProjectName = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.projectName;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage invoices, track payments, and monitor outstanding balances"
        actions={
          <Button asChild>
            <Link href={routes.finance.invoices.new}>New Invoice</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Invoices
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalInvoices}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileText className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Paid</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {paidInvoices}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              fully settled
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pending / Sent
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {pendingInvoices}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting payment
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAmount / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <DollarSign className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              all invoices
            </p>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <SearchAndFilter
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by invoice number, notes..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              {
                value: InvoiceStatus.draft,
                label: invoiceStatusLabels[InvoiceStatus.draft],
              },
              {
                value: InvoiceStatus.pending,
                label: invoiceStatusLabels[InvoiceStatus.pending],
              },
              {
                value: InvoiceStatus.sent,
                label: invoiceStatusLabels[InvoiceStatus.sent],
              },
              {
                value: InvoiceStatus.partiallyPaid,
                label: invoiceStatusLabels[InvoiceStatus.partiallyPaid],
              },
              {
                value: InvoiceStatus.paid,
                label: invoiceStatusLabels[InvoiceStatus.paid],
              },
              {
                value: InvoiceStatus.overdue,
                label: invoiceStatusLabels[InvoiceStatus.overdue],
              },
              {
                value: InvoiceStatus.cancelled,
                label: invoiceStatusLabels[InvoiceStatus.cancelled],
              },
              {
                value: InvoiceStatus.disputed,
                label: invoiceStatusLabels[InvoiceStatus.disputed],
              },
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
              {
                value: InvoiceType.purchase,
                label: invoiceTypeLabels[InvoiceType.purchase],
              },
              {
                value: InvoiceType.sales,
                label: invoiceTypeLabels[InvoiceType.sales],
              },
              {
                value: InvoiceType.expense,
                label: invoiceTypeLabels[InvoiceType.expense],
              },
              {
                value: InvoiceType.service,
                label: invoiceTypeLabels[InvoiceType.service],
              },
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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredInvoices.length)} of{' '}
          {filteredInvoices.length} invoices
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

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => {
                  const projectName = getProjectName(invoice.projectId);

                  return (
                    <TableRow
                      key={invoice.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        router.push(
                          routes.finance.invoices.detail(invoice.id).href
                        )
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(invoice.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(invoice.id, checked as boolean)
                          }
                          aria-label={`Select ${invoice.invoiceNumber}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {invoice.invoiceNumber}
                            </p>
                            {invoice.paymentTerms && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                Terms: {invoice.paymentTerms}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(invoice.type)}>
                          {invoiceTypeLabels[invoice.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {projectName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{invoice.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          <span>
                            {format(invoice.issueDate, 'dd MMM yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {format(invoice.dueDate, 'dd MMM yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoiceStatusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            invoice.balanceAmount > 0
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <FileText className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No invoices found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters.'
                    : 'Add your first invoice to get started.'}
                </EmptyDescription>
              </EmptyHeader>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href={routes.finance.invoices.new}>New Invoice</Link>
                </Button>
              )}
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
