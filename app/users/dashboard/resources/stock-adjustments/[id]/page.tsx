'use client';

import { use, useState } from 'react';

import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Separator } from '@/components/shadcn/separator';
import {
  Edit,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Calendar,
  User,
  FileText,
  ExternalLink,
  ShoppingCart,
  Receipt,
  ArrowLeftRight,
  FileSpreadsheet,
  Wallet,
  Settings,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { toast } from '@/lib/styles/toast-styles';
import Link from 'next/link';
import { mockStockAdjustments } from '@/components/shared/mock-data';

const handleDownloadPDF = () => {
  toast.success('Downloading stock adjustment report...');
};

const handlePrint = () => {
  globalThis.print();
};

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    case 'pending': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
    case 'approved': {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    case 'rejected': {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getOriginTypeLabel = (originType: string | undefined): string => {
  switch (originType) {
    case 'purchase_order': {
      return 'Purchase Order';
    }
    case 'goods_receipt': {
      return 'Goods Receipt';
    }
    case 'transfer': {
      return 'Transfer';
    }
    case 'return': {
      return 'Invoice';
    }
    case 'write_off': {
      return 'Expense';
    }
    default: {
      return 'Manual Entry';
    }
  }
};

const getOriginTypeText = (originType: string | undefined): string => {
  switch (originType) {
    case 'transfer': {
      return ' transfer';
    }
    case 'purchase_order': {
      return ' purchase order';
    }
    case 'goods_receipt': {
      return ' goods receipt';
    }
    case 'return': {
      return ' invoice';
    }
    case 'write_off': {
      return ' expense';
    }
    default: {
      return ' manual entry';
    }
  }
};

const getOriginUrl = (
  originType: string | undefined,
  id: number | undefined
): string => {
  if (!id) return '#';

  switch (originType) {
    case 'transfer': {
      return routes.resources.transfers.detail(id).href;
    }
    case 'purchase_order': {
      return routes.resources.purchaseOrders.detail(id).href;
    }
    case 'goods_receipt': {
      return routes.resources.goodsReceipts.detail(id).href;
    }
    case 'return': {
      return '#';
    }
    case 'write_off': {
      return routes.finance.expenses.detail(id).href;
    }
    default: {
      return '#';
    }
  }
};

export default function StockAdjustmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // In a real app, fetch data based on ID
  const adjustment = mockStockAdjustments.find(
    (sa) => sa.id === Number.parseInt(id)
  );

  const [isDeleting, setIsDeleting] = useState(false);

  if (!adjustment) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Settings className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Stock adjustment not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.stockAdjustments.href}>
            Back to Stock Adjustments
          </Link>
        </Button>
      </Empty>
    );
  }

  const handleEdit = () => {
    router.push(routes.resources.stockAdjustments.detail(id).edit);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Stock Adjustment deleted successfully');
      router.push(routes.resources.stockAdjustments.href);
    }, 1000);
  };

  const handleApprove = () => {
    toast.success('Stock Adjustment approved successfully');
    router.refresh();
  };

  const handleReject = () => {
    toast.error('Stock Adjustment rejected');
    router.refresh();
  };

  const totalImpact = adjustment.lineItems.reduce(
    (sum, item) => sum + item.totalAdjustmentValue,
    0
  );
  const surplusItems = adjustment.lineItems.filter(
    (item) => item.adjustmentQuantity > 0
  ).length;
  const shortageItems = adjustment.lineItems.filter(
    (item) => item.adjustmentQuantity < 0
  ).length;

  // Get the correct origin ID based on originType
  const getOriginId = () => {
    if (!adjustment.originType) return;

    switch (adjustment.originType) {
      case 'transfer': {
        return adjustment.transferId || adjustment.originId;
      }
      case 'purchase_order': {
        return adjustment.purchaseOrderId || adjustment.originId;
      }
      case 'goods_receipt': {
        return adjustment.goodsReceiptId || adjustment.originId;
      }
      case 'return': {
        return adjustment.invoiceId || adjustment.originId;
      }
      case 'write_off': {
        return adjustment.expenseId || adjustment.originId;
      }
      default: {
        return adjustment.originId;
      }
    }
  };

  const originId = getOriginId();

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              {adjustment.adjustmentNumber}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Created {format(adjustment.submittedAt, 'PPP')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Status and Type Badges */}
        <div className="mt-4 flex gap-2">
          <Badge className={getStatusBadgeColor(adjustment.status)}>
            {adjustment.status}
          </Badge>
          <Badge variant="outline">{adjustment.type}</Badge>
        </div>
      </div>

      {/* Action Buttons for Pending Status */}
      {adjustment.status === 'Pending' && (
        <div className="mb-6 flex gap-2">
          <Button onClick={handleApprove}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve Adjustment
          </Button>
          <Button variant="outline" onClick={handleReject}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject Adjustment
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Adjustment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Adjustment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Adjustment Type
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.type}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Location ID
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.locationId || 'N/A'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Adjustment Date
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(adjustment.adjustmentDate, 'PPP')}
                  </div>
                </div>

                {adjustment.approvedAt && (
                  <div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Approved Date
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(adjustment.approvedAt, 'PPP')}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Reason
                </div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {adjustment.primaryReason}
                </div>
              </div>

              {adjustment.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Notes
                    </div>
                    <div className="text-zinc-900 dark:text-zinc-100">
                      {adjustment.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Origin Tracking */}
          {adjustment.originType && originId && (
            <Card>
              <CardHeader>
                <CardTitle>Origin Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <div className="mb-2 flex items-center gap-2">
                    {adjustment.originType === 'transfer' && (
                      <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {adjustment.originType === 'purchase_order' && (
                      <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {adjustment.originType === 'goods_receipt' && (
                      <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {adjustment.originType === 'return' && (
                      <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {adjustment.originType === 'write_off' && (
                      <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {adjustment.originType === 'manual' && (
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      Originated from{' '}
                      {getOriginTypeLabel(adjustment.originType)}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    This stock adjustment was automatically created when the
                    {getOriginTypeText(adjustment.originType)} was processed.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Origin Type
                    </div>
                    <div className="font-medium text-zinc-900 capitalize dark:text-zinc-100">
                      {adjustment.originType === 'purchaseOrder'
                        ? 'Purchase Order'
                        : adjustment.originType === 'goodsReceipt'
                          ? 'Goods Receipt'
                          : adjustment.originType}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Origin ID
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {originId}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  {adjustment.costImpact !== undefined &&
                    adjustment.costImpact !== null && (
                      <div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Cost Impact
                        </div>
                        <div
                          className={`font-semibold ${
                            adjustment.costImpact > 0
                              ? 'text-green-600 dark:text-green-400'
                              : adjustment.costImpact < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {adjustment.costImpact > 0 ? '+' : ''}₹
                          {adjustment.costImpact.toLocaleString()}
                        </div>
                      </div>
                    )}
                  <div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Financially Processed
                    </div>
                    <div>
                      {adjustment.isFinanciallyProcessed ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Link href={getOriginUrl(adjustment.originType, originId)}>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Original {getOriginTypeLabel(adjustment.originType)}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adjustment Items */}
          <Card>
            <CardHeader>
              <CardTitle>Adjustment Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adjustment.lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {index + 1}. {item.description}
                        </div>
                        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {item.reason}
                        </div>
                      </div>
                      <Badge
                        className={
                          item.adjustmentQuantity > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : item.adjustmentQuantity < 0
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                        }
                      >
                        {item.adjustmentQuantity > 0 ? '+' : ''}
                        {item.adjustmentQuantity} {item.unit}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          System Quantity
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.systemQuantity} {item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          Physical Quantity
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.physicalQuantity} {item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          Unit Value
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          ₹{item.unitValue.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Financial Impact:
                      </span>
                      <span
                        className={`font-semibold ${
                          item.totalAdjustmentValue > 0
                            ? 'text-green-600 dark:text-green-400'
                            : item.totalAdjustmentValue < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {item.totalAdjustmentValue > 0 ? '+' : ''}₹
                        {item.totalAdjustmentValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Total Impact */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Total Financial Impact:
                </span>
                <span
                  className={`text-xl font-bold ${
                    totalImpact > 0
                      ? 'text-green-600 dark:text-green-400'
                      : totalImpact < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {totalImpact > 0 ? '+' : ''}₹{totalImpact.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <div className="flex-1">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Adjustment Number
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.adjustmentNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <div className="flex-1">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Total Items
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.lineItems.length}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <div className="flex-1">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Created By
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    EMP-{adjustment.submittedBy.toString().padStart(3, '0')}
                  </div>
                </div>
              </div>

              {adjustment.approvedBy && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  <div className="flex-1">
                    <div className="text-zinc-500 dark:text-zinc-400">
                      Approved By
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      EMP-{adjustment.approvedBy.toString().padStart(3, '0')}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <div className="flex-1">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Created Date
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(adjustment.submittedAt, 'PPP')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <div className="flex-1">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Last Updated
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(adjustment.updatedAt, 'PPP')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Surplus Items:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {surplusItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Shortage Items:
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {shortageItems}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Net Impact:
                </span>
                <span
                  className={`font-bold ${
                    totalImpact > 0
                      ? 'text-green-600 dark:text-green-400'
                      : totalImpact < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {totalImpact > 0 ? '+' : ''}₹
                  {(Math.abs(totalImpact) / 1000).toFixed(2)}K
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Adjustment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
