'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
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
import { useGRN, useDeleteGRN } from '@tornotron/echno-core/grn/hooks';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
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
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Receipt className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>GRN not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.goodsReceipts.href}>Back to GRNs</Link>
        </Button>
      </Empty>
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
            onError: (err) =>
              toast.error(getErrorTitle(err, 'Delete Not Supported'), {
                description: getErrorMessage(err),
              }),
          })
        }
        isPending={isDeleting}
      />

      {/* Header */}
      <PageHeader
        title={grn.grnNumber}
        description={
          <div className="flex flex-wrap items-center gap-2">
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
        }
        actions={
          <Button
            variant="destructive"
            size="sm"
            aria-label="Delete goods receipt"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />

      {/* Immutability notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          GRNs are immutable once created. Stock has been automatically updated.
          Remember to manually update the linked PO status if needed.
        </span>
      </div>

      {/* Key Metrics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Items
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {grn.items.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Package className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">received</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Invoice Amount
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {grn.invoiceAmount == null
                  ? '—'
                  : `₹${grn.invoiceAmount.toLocaleString('en-IN')}`}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <IndianRupee className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              billed amount
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Received On
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {format(new Date(grn.receivedOn), 'dd MMM')}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <CalendarDays className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              receipt date
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Vendor</p>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {grn.vendorName}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Building2 className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">supplier</p>
          </div>
        </div>
      </Card>

      <GRNItemsCard grn={grn} />

      <div className="grid gap-4 md:grid-cols-2">
        <GRNReceiptInfoCard grn={grn} />
        <GRNVendorPOCard grn={grn} />
      </div>
    </div>
  );
}
