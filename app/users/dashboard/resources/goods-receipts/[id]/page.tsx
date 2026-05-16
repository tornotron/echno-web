'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Loader2,
  Receipt,
  Building2,
  Package,
  CalendarDays,
  IndianRupee,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useGRN, useDeleteGRN } from '@/hooks/grn';
import {
  DeleteGRNDialog,
  GRNItemsCard,
  GRNReceiptInfoCard,
  GRNVendorPOCard,
} from '@/features/grn/components';

export default function GRNDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: grn, isLoading } = useGRN(id);
  const { mutate: deleteGRN, isPending: isDeleting } = useDeleteGRN();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading GRN...</p>
        </div>
      </div>
    );
  }

  if (!grn) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Receipt className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">GRN not found</h3>
          <Button
            onClick={() => router.push(routes.resources.goodsReceipts.href)}
          >
            Back to GRNs
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <DeleteGRNDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        grnNumber={grn.grnNumber}
        onConfirm={() =>
          deleteGRN(id, {
            onSuccess: () => router.push(routes.resources.goodsReceipts.href),
          })
        }
        isPending={isDeleting}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {grn.grnNumber}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Goods Received Note
            </Badge>
            {grn.purchaseOrderNumber && (
              <Badge variant="outline" className="text-xs">
                PO: {grn.purchaseOrderNumber}
              </Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Received {format(new Date(grn.receivedOn), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Immutability notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          GRNs are immutable once created. Stock has been automatically updated.
          Remember to manually update the linked PO status if needed.
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Total Items</p>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{grn.items.length}</div>
            <p className="text-muted-foreground text-xs">Materials received</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Invoice Amount</p>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {grn.invoiceAmount == null
                ? '—'
                : `₹${grn.invoiceAmount.toLocaleString('en-IN')}`}
            </div>
            <p className="text-muted-foreground text-xs">Invoice value</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Received On</p>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(grn.receivedOn), 'dd MMM')}
            </div>
            <p className="text-muted-foreground text-xs">
              {format(new Date(grn.receivedOn), 'yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Vendor</p>
            <Building2 className="h-4 w-4 text-zinc-400" />
          </div>
          <CardContent>
            <div className="truncate text-xl font-bold">{grn.vendorName}</div>
            <p className="text-muted-foreground text-xs">Supplier</p>
          </CardContent>
        </Card>
      </div>

      <GRNItemsCard grn={grn} />

      <div className="grid gap-4 md:grid-cols-2">
        <GRNReceiptInfoCard grn={grn} />
        <GRNVendorPOCard grn={grn} />
      </div>
    </div>
  );
}
