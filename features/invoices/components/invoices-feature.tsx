'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Pagination } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Table,
  TableBody,
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
import { FileText, Search, Loader2 } from 'lucide-react';
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
  ConstructionInvoice,
  ConstructionInvoiceType,
  ConstructionInvoiceStatus,
  invoiceTypeLabels,
  invoiceStatusLabels,
} from '@/types/finance/invoice';
import { Project } from '@tornotron/echno-core/project/types';
import { InvoiceRow } from './invoice-row';

interface InvoicesFeatureProps {
  invoices: ConstructionInvoice[];
  projects: Project[];
  isLoading?: boolean;
  isError?: boolean;
}

export function InvoicesFeature({
  invoices,
  projects,
  isLoading = false,
  isError = false,
}: InvoicesFeatureProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedInvoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
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
            placeholder="Search by invoice number, notes..."
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.DRAFT}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.DRAFT]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.PENDING}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.PENDING]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.SENT}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.SENT]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.PARTIALLY_PAID}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.PARTIALLY_PAID]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.PAID}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.PAID]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.OVERDUE}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.OVERDUE]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.CANCELLED}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.CANCELLED]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceStatus.DISPUTED}>
              {invoiceStatusLabels[ConstructionInvoiceStatus.DISPUTED]}
            </SelectItem>
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
            <SelectItem value={ConstructionInvoiceType.PURCHASE}>
              {invoiceTypeLabels[ConstructionInvoiceType.PURCHASE]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceType.SALES}>
              {invoiceTypeLabels[ConstructionInvoiceType.SALES]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceType.EXPENSE}>
              {invoiceTypeLabels[ConstructionInvoiceType.EXPENSE]}
            </SelectItem>
            <SelectItem value={ConstructionInvoiceType.SERVICE}>
              {invoiceTypeLabels[ConstructionInvoiceType.SERVICE]}
            </SelectItem>
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
                    <FileText className="size-6" />
                  </EmptyErrorMedia>
                  <EmptyHeader>
                    <EmptyTitle>Failed to load invoices</EmptyTitle>
                    <EmptyDescription>
                      An unexpected error occurred. Please try again.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            );
          if (paginatedInvoices.length > 0)
            return (
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
                  {paginatedInvoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      isSelected={selectedIds.includes(invoice.id)}
                      onSelect={(checked) =>
                        handleSelectOne(invoice.id, checked as boolean)
                      }
                      projectName={getProjectName(invoice.projectId)}
                      onClick={() =>
                        router.push(
                          routes.finance.invoices.detail(invoice.id).href
                        )
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            );
          return (
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
          );
        })()}
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {filteredInvoices.length === 0
            ? '0 records'
            : `${startIndex + 1}–${Math.min(endIndex, filteredInvoices.length)} of ${filteredInvoices.length} ${filteredInvoices.length === 1 ? 'invoice' : 'invoices'}`}
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
