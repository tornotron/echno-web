'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  Loader2,
  Package,
  CalendarDays,
  Building2,
  IndianRupee,
  FolderOpen,
  Trash2,
  ChevronDown,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  usePurchaseOrder,
  useDeletePurchaseOrder,
} from '@/hooks/purchase-orders';
import {
  purchaseOrderStatusLabels,
  purchaseOrderStatusBadgeColors,
} from '@/types/purchase-orders';
import {
  DeletePODialog,
  POItemsCard,
  POInfoCard,
  PORemarksCard,
} from '@/features/purchase-orders/components';

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: po, isLoading } = usePurchaseOrder(id);
  const { mutate: deletePO, isPending: isDeleting } = useDeletePurchaseOrder();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading purchase order...
          </p>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <ShoppingCart className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Purchase order not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.purchaseOrders.href}>
            Back to Purchase Orders
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <DeletePODialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        poNumber={po.poNumber}
        onConfirm={() =>
          deletePO(id, {
            onSuccess: () => router.push(routes.resources.purchaseOrders.href),
          })
        }
        isPending={isDeleting}
      />

      {/* Header */}
      <PageHeader
        title={po.poNumber}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={purchaseOrderStatusBadgeColors[po.status]}>
              {purchaseOrderStatusLabels[po.status]}
            </Badge>
            {po.indentNumber && (
              <Badge variant="outline" className="text-xs">
                <FolderOpen className="mr-1 h-3 w-3" />
                {po.indentNumber}
              </Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Created {format(new Date(po.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions <ChevronDown className="ml-1.5 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    router.push(
                      `${routes.resources.goodsReceipts.new}?fromPO=${id}`
                    )
                  }
                >
                  <ClipboardList className="h-4 w-4" />
                  Create GRN
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Total Items</p>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{po.items.length}</div>
            <p className="text-muted-foreground text-xs">Materials ordered</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Total Amount</p>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {po.totalAmount != null && po.totalAmount > 0
                ? `₹${po.totalAmount.toLocaleString('en-IN')}`
                : '—'}
            </div>
            <p className="text-muted-foreground text-xs">Order value</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Expected Delivery</p>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">
              {po.expectedDeliveryDate
                ? format(new Date(po.expectedDeliveryDate), 'dd MMM')
                : '—'}
            </div>
            <p className="text-muted-foreground text-xs">
              {po.expectedDeliveryDate
                ? format(new Date(po.expectedDeliveryDate), 'yyyy')
                : 'No date set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Vendor</p>
            <Building2 className="h-4 w-4 text-zinc-400" />
          </div>
          <CardContent>
            <div className="truncate text-xl font-bold">{po.vendorName}</div>
            <p className="text-muted-foreground text-xs">
              {format(new Date(po.createdAt), 'MMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      <POItemsCard po={po} />

      <div className="grid gap-4 md:grid-cols-2">
        <POInfoCard po={po} />
        <PORemarksCard po={po} />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        After recording a GRN for this PO, remember to manually update the PO
        status to &quot;Partially Received&quot; or &quot;Fully Received&quot;.
      </div>
    </div>
  );
}
