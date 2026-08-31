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
import { PageHeader } from '@/components/common';
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
  Loader2,
  CopyPlus,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { toast } from '@/lib/styles/toast-styles';
import Link from 'next/link';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { getErrorMessage } from '@tornotron/echno-core';
import { userFilterHref } from '@/hooks/use-employee-filter';
import {
  useStockAdjustment,
  useApproveStockAdjustment,
  useDeleteStockAdjustment,
} from '@/hooks/stock-adjustments';
import { useAuthorization } from '@/hooks/use-authorization';
import { stockAdjustmentApprovalGate } from '@/features/stock-adjustments/approval-gate';
import {
  canRejectStockAdjustment,
  stockAdjustmentAmendmentGate,
} from '@/features/stock-adjustments/decision-gates';
import { RejectStockAdjustment } from '@/features/stock-adjustments/components';
import { userStampLabel } from '@/lib/utils/user-reference';


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
  const numericId = Number.parseInt(id);
  const { data: adjustment } = useStockAdjustment(numericId);
  const { data: currentUser } = useUser();
  const { isSystemAdmin, isManagerOrAbove } = useAuthorization();
  const approveAdjustment = useApproveStockAdjustment();
  const deleteAdjustment = useDeleteStockAdjustment();
  const [confirmingApproval, setConfirmingApproval] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  async function handleDelete() {
    try {
      await deleteAdjustment.mutateAsync(numericId);
      toast.success('Stock adjustment deleted');
      router.push(routes.resources.stockAdjustments.href);
    } catch (error) {
      toast.error('Failed to delete stock adjustment', {
        description: getErrorMessage(error),
      });
    }
  }

  async function handleApprove() {
    try {
      await approveAdjustment.mutateAsync(numericId);
      setConfirmingApproval(false);
      toast.success('Stock adjustment approved', {
        description: 'Its lines are posted and the stock balances have moved.',
      });
    } catch (error) {
      setConfirmingApproval(false);
      toast.error('Failed to approve stock adjustment', {
        description: getErrorMessage(error),
      });
    }
  }

  const canDecide = isSystemAdmin || isManagerOrAbove;

  const approval = stockAdjustmentApprovalGate({
    adjustment,
    currentUserId: currentUser?.id,
    canApprove: canDecide,
    isSystemAdmin,
  });

  // Only for the action row's own visibility; RejectStockAdjustment applies
  // the same gate itself. Deliberately not gated on who raised the document:
  // self-rejection is allowed, and reusing the approval gate's raiser check
  // here would refuse something the backend permits.
  const canReject = canRejectStockAdjustment({
    adjustment,
    canReject: canDecide,
  });

  // A posted or rejected document refuses update and delete as well, so the
  // Edit and Delete affordances come off it rather than 400ing when pressed.
  const amendment = stockAdjustmentAmendmentGate(adjustment);

  const duplicateHref = `${routes.resources.stockAdjustments.new}?from=${adjustment.id}`;

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
      <PageHeader
        title={adjustment.adjustmentNumber}
        description={`Created ${format(adjustment.submittedAt, 'PPP')}`}
        actions={
          amendment.allowed ? (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmingDelete(true)}
                disabled={deleteAdjustment.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteAdjustment.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          ) : (
            amendment.rejected && (
              <Button variant="outline" asChild>
                <Link href={duplicateHref}>
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Raise a fresh adjustment
                </Link>
              </Button>
            )
          )
        }
      />

      {/* Status and Type Badges */}
      <div className="flex gap-2">
        <Badge className={getStatusBadgeColor(adjustment.status)}>
          {adjustment.status}
        </Badge>
        <Badge variant="outline">{adjustment.type}</Badge>
      </div>

      {/* The refusal, which is the whole point of rejecting rather than deleting. */}
      {amendment.rejected && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-zinc-900 dark:text-zinc-100">
              {adjustment.rejectionReason || 'No reason was recorded.'}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">
              {adjustment.rejectedBy ? (
                <>
                  Rejected by{' '}
                  {/*
                    A user id, like submittedBy and approvedBy two cards down,
                    and unlike physicalCountBy on the same document, which comes
                    off the creation payload and is an employee id.
                  */}
                  <Link
                    href={userFilterHref(
                      routes.resources.stockAdjustments.href,
                      adjustment.rejectedBy,
                      'rejecter'
                    )}
                    className="hover:underline"
                  >
                    {userStampLabel(
                      adjustment.rejectedByName,
                      adjustment.rejectedBy
                    )}
                  </Link>
                </>
              ) : (
                'Rejected'
              )}
              {adjustment.rejectedAt &&
                ` on ${format(adjustment.rejectedAt, 'PPP')}`}
              . No stock moved.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Why Edit and Delete are not on a decided document. */}
      {!amendment.allowed && amendment.reason && (
        <p className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {amendment.reason}
        </p>
      )}

      {/* Approval. Posts the lines to the stock ledger and moves the balances. */}
      {(approval.visible || canReject) && (
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap gap-2">
            {approval.visible && (
              <Button
                onClick={() => setConfirmingApproval(true)}
                disabled={!approval.enabled || approveAdjustment.isPending}
              >
                {approveAdjustment.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve Adjustment
              </Button>
            )}
            {/*
              Offered even where approval is not. The reasons approval is
              refused (the caller raised it, no project, no lines, a line with
              no material) are all reasons a document deserves refusing, and a
              rejection posts nothing that any of them would make invalid.
            */}
            <RejectStockAdjustment
              adjustment={adjustment}
              canDecide={canDecide}
            />
          </div>
          {approval.reason && (
            <p className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {approval.reason}
            </p>
          )}
          {approval.enabled && approval.selfApproval && (
            <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              You raised this adjustment. Approving it yourself is allowed under
              the system administrator role and is recorded as a self-approval
              on the ledger entries.
            </p>
          )}
        </div>
      )}

      <AlertDialog
        open={confirmingApproval}
        onOpenChange={setConfirmingApproval}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve stock adjustment</AlertDialogTitle>
            <AlertDialogDescription>
              Approve <strong>{adjustment.adjustmentNumber}</strong>? Each line
              is posted to the stock ledger and the balance for its material
              moves to the counted figure. This runs once: the document is
              frozen afterwards, and a mistake is corrected by raising another
              adjustment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveAdjustment.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveAdjustment.isPending}
            >
              {approveAdjustment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve and post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stock adjustment</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{adjustment.adjustmentNumber}</strong>? This cannot
              be undone. A document already posted to the ledger cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAdjustment.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAdjustment.isPending}
            >
              {deleteAdjustment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    Project
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.projectName ||
                      adjustment.projectId ||
                      'Not set'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Storage Location
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.locationName ||
                      adjustment.locationId ||
                      'Not set'}
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
                      {adjustment.originType === 'purchase_order'
                        ? 'Purchase Order'
                        : adjustment.originType === 'goods_receipt'
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
                    <Link
                      href={userFilterHref(
                        routes.resources.stockAdjustments.href,
                        adjustment.submittedBy,
                        'submitter'
                      )}
                      className="hover:underline"
                    >
                      {userStampLabel(adjustment.submittedByName, adjustment.submittedBy)}
                    </Link>
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
                      <Link
                        href={userFilterHref(
                          routes.resources.stockAdjustments.href,
                          adjustment.approvedBy,
                          'approver'
                        )}
                        className="hover:underline"
                      >
                        {userStampLabel(adjustment.approvedByName, adjustment.approvedBy)}
                      </Link>
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
