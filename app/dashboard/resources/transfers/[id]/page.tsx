'use client';

import { use } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/common/app-layout';
import {
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Download,
  Printer,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import {
  TransferStatus,
  TransferPriority,
  transferStatusLabels,
  transferPriorityLabels,
  transferTypeLabels,
} from '@/types/resource/transfer';
import { mockTransfers } from '@/components/shared/mock-data';
import { toast } from 'sonner';

// Helper functions for badge colors
const getStatusBadgeColor = (status: TransferStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    in_transit:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    completed:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

const getPriorityBadgeColor = (priority: TransferPriority): string => {
  const colors = {
    low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[priority];
};

const handleApprove = () => {
  toast.success('Transfer approved successfully');
};

const handleReject = () => {
  toast.error('Transfer rejected');
};

const handleMarkInTransit = () => {
  toast.success('Transfer marked as in transit');
};

const handleMarkCompleted = () => {
  toast.success('Transfer completed');
};

const handleDelete = () => {
  toast.success('Transfer deleted successfully');
};

export default function TransferViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const transfer = mockTransfers.find((t) => t.id === Number.parseInt(id));

  if (!transfer) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                {transfer.transferNumber}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Created on {format(transfer.requestDate, 'MMMM dd, yyyy')}
              </p>
            </div>

            <div className="flex gap-2">
              <Link href={`/dashboard/resources/transfers/${transfer.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className={getStatusBadgeColor(transfer.status)}>
            {transferStatusLabels[transfer.status]}
          </Badge>
          <Badge className={getPriorityBadgeColor(transfer.priority)}>
            {transferPriorityLabels[transfer.priority]}
          </Badge>
          <Badge variant="outline">{transferTypeLabels[transfer.type]}</Badge>
          {transfer.isTemporary && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
            >
              Temporary Transfer
            </Badge>
          )}
        </div>

        {/* Action Buttons based on status */}
        <div className="mt-4 flex flex-wrap gap-2">
          {transfer.status === TransferStatus.pending && (
            <>
              <Button onClick={handleApprove} size="sm">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Transfer
              </Button>
              <Button onClick={handleReject} variant="destructive" size="sm">
                <XCircle className="mr-2 h-4 w-4" />
                Reject Transfer
              </Button>
            </>
          )}
          {transfer.status === TransferStatus.approved && (
            <Button onClick={handleMarkInTransit} size="sm">
              <Truck className="mr-2 h-4 w-4" />
              Mark as In Transit
            </Button>
          )}
          {transfer.status === TransferStatus.inTransit && (
            <Button onClick={handleMarkCompleted} size="sm">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Completed
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Transfer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Transfer Type
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {transferTypeLabels[transfer.type]}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Request Date
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {format(transfer.requestDate, 'MMM dd, yyyy')}
                    </p>
                  </div>

                  {transfer.scheduledDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Scheduled Date
                      </label>
                      <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.scheduledDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {transfer.actualTransferDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Actual Transfer Date
                      </label>
                      <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.actualTransferDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {transfer.expectedDeliveryDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Expected Delivery
                      </label>
                      <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.expectedDeliveryDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {transfer.actualDeliveryDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Actual Delivery
                      </label>
                      <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.actualDeliveryDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {transfer.purpose && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Purpose
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {transfer.purpose}
                    </p>
                  </div>
                )}

                {transfer.notes && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Notes
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {transfer.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transport Details */}
            {transfer.transportMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Transport Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Transport Method
                      </label>
                      <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                        {transfer.transportMethod}
                      </p>
                    </div>

                    {transfer.vehicleNumber && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Vehicle Number
                        </label>
                        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {transfer.vehicleNumber}
                        </p>
                      </div>
                    )}

                    {transfer.driverName && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Driver Name
                        </label>
                        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {transfer.driverName}
                        </p>
                      </div>
                    )}

                    {transfer.driverPhone && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Driver Phone
                        </label>
                        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {transfer.driverPhone}
                        </p>
                      </div>
                    )}

                    {transfer.transportCost && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Transport Cost
                        </label>
                        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                          ₹{(transfer.transportCost / 1000).toFixed(1)}K
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Transfer Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transfer.lineItems.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                              #{index + 1}
                            </span>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.description}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Requested:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityRequested} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Approved:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityApproved} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Transferred:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityTransferred} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Unit Value:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            ₹{item.unitValue.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {(item.conditionBefore || item.conditionAfter) && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          {item.conditionBefore && (
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-400">
                                Condition Before:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.conditionBefore}
                              </p>
                            </div>
                          )}
                          {item.conditionAfter && (
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-400">
                                Condition After:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.conditionAfter}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          Total Value:
                        </span>
                        <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{(item.totalValue / 1000).toFixed(1)}K
                        </span>
                      </div>

                      {item.notes && (
                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Total Transfer Value:
                  </span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{(transfer.totalValue / 100_000).toFixed(2)}L
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Stock Adjustments */}
            {(transfer.stockAdjustmentIds &&
              transfer.stockAdjustmentIds.length > 0) ||
            transfer.sourceStockAdjustmentId ||
            transfer.destStockAdjustmentId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Stock Adjustments ({' '}
                    {(transfer.stockAdjustmentIds?.length || 0) +
                      (transfer.sourceStockAdjustmentId ? 1 : 0) +
                      (transfer.destStockAdjustmentId ? 1 : 0)}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Stock adjustments automatically created for this transfer:
                  </p>

                  {transfer.sourceStockAdjustmentId && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="font-semibold text-red-900 dark:text-red-100">
                          Source Location Adjustment
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-red-700 dark:text-red-300">
                        Stock reduction at source location ID:{' '}
                        {transfer.sourceLocationId}
                      </p>
                      <Link
                        href={`/dashboard/resources/stock-adjustments/${transfer.sourceStockAdjustmentId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                      >
                        View Adjustment #{transfer.sourceStockAdjustmentId}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {transfer.destStockAdjustmentId && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/20">
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          Destination Location Adjustment
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-green-700 dark:text-green-300">
                        Stock addition at destination location ID:{' '}
                        {transfer.destinationLocationId}
                      </p>
                      <Link
                        href={`/dashboard/resources/stock-adjustments/${transfer.destStockAdjustmentId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                      >
                        View Adjustment #{transfer.destStockAdjustmentId}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {transfer.stockAdjustmentIds &&
                    transfer.stockAdjustmentIds.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Additional Adjustments:
                        </div>
                        <div className="space-y-2">
                          {transfer.stockAdjustmentIds.map((adjId) => (
                            <Link
                              key={adjId}
                              href={`/dashboard/resources/stock-adjustments/${adjId}`}
                              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            >
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                  Stock Adjustment #{adjId}
                                </span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-zinc-400" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  {transfer.inventoryUpdated && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Inventory Successfully Updated
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        All stock adjustments have been processed and inventory
                        records are up to date.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Financial Tracking */}
            {(transfer.totalCostTransferred ||
              transfer.totalTransportCost ||
              transfer.transportExpenseId) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {transfer.totalCostTransferred && (
                      <div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Total Cost Transferred
                        </div>
                        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{transfer.totalCostTransferred.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {transfer.totalTransportCost && (
                      <div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Transport Cost
                        </div>
                        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{transfer.totalTransportCost.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {transfer.transportExpenseId && (
                    <>
                      <Separator />
                      <div>
                        <div className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                          Linked Transport Expense
                        </div>
                        <Link
                          href={`/dashboard/finance/expenses/${transfer.transportExpenseId}`}
                        >
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Expense #{transfer.transportExpenseId}
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}

                  {transfer.totalCostTransferred &&
                    transfer.totalTransportCost && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            Total Transfer Cost:
                          </span>
                          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            ₹
                            {(
                              transfer.totalCostTransferred +
                              transfer.totalTransportCost
                            ).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Discrepancies Warning */}
            {transfer.hasDiscrepancies && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <h4 className="mb-1 font-semibold text-orange-900 dark:text-orange-100">
                        Discrepancies Detected
                      </h4>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        There are discrepancies in this transfer. Please review
                        the details carefully.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Transfer Number:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {transfer.transferNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Total Items:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {transfer.lineItems.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Requested By:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    EMP-{transfer.requestedBy.toString().padStart(3, '0')}
                  </span>
                </div>
                {transfer.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Approved By:
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      EMP-{transfer.approvedBy.toString().padStart(3, '0')}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Created:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(
                      transfer.createdAt || transfer.requestDate,
                      'MMM dd, yyyy'
                    )}
                  </span>
                </div>
                {transfer.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Last Updated:
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(transfer.updatedAt, 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Temporary Transfer Info */}
            {transfer.isTemporary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Temporary Transfer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {transfer.expectedReturnDate && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Expected Return:
                      </span>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.expectedReturnDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {transfer.actualReturnDate && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Actual Return:
                      </span>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.actualReturnDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quality Check */}
            {transfer.qualityCheckRequired && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quality Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    {transfer.qualityCheckPassed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {transfer.qualityCheckPassed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  {transfer.inspectedBy && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Inspected By:
                      </span>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        EMP-{transfer.inspectedBy.toString().padStart(3, '0')}
                      </p>
                    </div>
                  )}
                  {transfer.inspectedAt && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Inspection Date:
                      </span>
                      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {format(transfer.inspectedAt, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Transfer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
