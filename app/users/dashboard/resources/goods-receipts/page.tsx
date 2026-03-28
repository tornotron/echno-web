'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchAndFilter } from '@/components/common';
import { Pagination } from '@/components/common';
import {
  Plus,
  Loader2,
  Receipt,
  CalendarDays,
  IndianRupee,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import { useGRNs } from '@/hooks/grn';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const { data: grns = [], isLoading } = useGRNs();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [prevFilters, setPrevFilters] = useState({ searchQuery, itemsPerPage });

  if (
    prevFilters.searchQuery !== searchQuery ||
    prevFilters.itemsPerPage !== itemsPerPage
  ) {
    setPrevFilters({ searchQuery, itemsPerPage });
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return grns.filter(
      (grn) =>
        !searchQuery ||
        grn.grnNumber.toLowerCase().includes(q) ||
        grn.vendorName.toLowerCase().includes(q) ||
        grn.purchaseOrderNumber?.toLowerCase().includes(q) ||
        grn.projectName?.toLowerCase().includes(q)
    );
  }, [grns, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const now = new Date();
  const thisMonth = grns.filter((g) => {
    const d = new Date(g.receivedOn);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const totalInvoice = grns.reduce((sum, g) => sum + (g.invoiceAmount ?? 0), 0);
  const withPO = grns.filter((g) => !!g.purchaseOrderId).length;

  const hasActiveFilters = !!searchQuery;
  const clearFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Goods Receipts
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage goods received notes
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/users/dashboard/resources/goods-receipts/new">
            <Plus className="mr-2 h-4 w-4" />
            Record GRN
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            {
              label: 'Total GRNs',
              count: grns.length,
              color: 'blue',
              icon: Receipt,
            },
            {
              label: 'This Month',
              count: thisMonth.length,
              color: 'green',
              icon: CalendarDays,
            },
            {
              label: 'Linked to PO',
              count: withPO,
              color: 'purple',
              icon: ShoppingCart,
            },
            {
              label: 'Total Invoice Value',
              count:
                totalInvoice > 0
                  ? `₹${totalInvoice.toLocaleString('en-IN')}`
                  : '—',
              color: 'orange',
              icon: IndianRupee,
            },
          ] as const
        ).map(({ label, count, color, icon: Icon }) => {
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100 dark:bg-blue-900/20',
              text: 'text-blue-600 dark:text-blue-400',
            },
            green: {
              bg: 'bg-green-100 dark:bg-green-900/20',
              text: 'text-green-600 dark:text-green-400',
            },
            purple: {
              bg: 'bg-purple-100 dark:bg-purple-900/20',
              text: 'text-purple-600 dark:text-purple-400',
            },
            orange: {
              bg: 'bg-orange-100 dark:bg-orange-900/20',
              text: 'text-orange-600 dark:text-orange-400',
            },
          } satisfies Record<string, { bg: string; text: string }>;
          const classes = colorClasses[color];
          return (
            <Card key={label}>
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${classes.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${classes.text}`} />
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {count}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by GRN number, vendor, PO or project..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length === 0
            ? 'No goods receipts found'
            : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filtered.length)} of ${filtered.length} GRN${filtered.length === 1 ? '' : 's'}`}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table or empty state */}
      {paginated.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">GRN Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Received On</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="pr-6">Invoice Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((grn) => (
                  <TableRow
                    key={grn.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() =>
                      router.push(
                        `/users/dashboard/resources/goods-receipts/${grn.id}`
                      )
                    }
                  >
                    <TableCell className="pl-6 font-medium">
                      {grn.grnNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {grn.vendorName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(grn.receivedOn), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {grn.purchaseOrderNumber ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {grn.projectName ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {grn.items.length}
                    </TableCell>
                    <TableCell className="text-muted-foreground pr-6 text-sm">
                      {grn.invoiceAmount == null
                        ? '—'
                        : `₹${grn.invoiceAmount.toLocaleString('en-IN')}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium">
              No goods receipts found
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {hasActiveFilters
                ? 'No GRNs match your search. Try adjusting your search.'
                : 'Record your first GRN to get started.'}
            </p>
            {!hasActiveFilters && (
              <Button asChild>
                <Link href="/users/dashboard/resources/goods-receipts/new">
                  Record GRN
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
