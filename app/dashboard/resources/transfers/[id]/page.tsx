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
  Clock,
  Package,
  MapPin,
  Truck,
  User,
  Calendar,
  FileText,
  Download,
  Printer,
  AlertCircle,
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
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    in_transit: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
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

export default function TransferViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const transfer = mockTransfers.find((t) => t.id === Number.parseInt(id));

  if (!transfer) {
    notFound();
  }



  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {transfer.transferNumber}
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Created on {format(transfer.requestDate, 'MMMM dd, yyyy')}
                </p>
              </div>

              <div className="flex gap-2">
              <Link href={`/dashboard/resources/transfers/${transfer.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className={getStatusBadgeColor(transfer.status)}>
              {transferStatusLabels[transfer.status]}
            </Badge>
            <Badge className={getPriorityBadgeColor(transfer.priority)}>
              {transferPriorityLabels[transfer.priority]}
            </Badge>
            <Badge variant="outline">{transferTypeLabels[transfer.type]}</Badge>
            {transfer.isTemporary && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                Temporary Transfer
              </Badge>
            )}
          </div>

          {/* Action Buttons based on status */}
          <div className="flex flex-wrap gap-2 mt-4">
            {transfer.status === TransferStatus.pending && (
              <>
                <Button onClick={handleApprove} size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Transfer
                </Button>
                <Button onClick={handleReject} variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Transfer
                </Button>
              </>
            )}
            {transfer.status === TransferStatus.approved && (
              <Button onClick={handleMarkInTransit} size="sm">
                <Truck className="h-4 w-4 mr-2" />
                Mark as In Transit
              </Button>
            )}
            {transfer.status === TransferStatus.inTransit && (
              <Button onClick={handleMarkCompleted} size="sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Transfer Type
                    </label>
                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                      {transferTypeLabels[transfer.type]}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Request Date
                    </label>
                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                      {format(transfer.requestDate, 'MMM dd, yyyy')}
                    </p>
                  </div>

                  {transfer.scheduledDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Scheduled Date
                      </label>
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {format(transfer.scheduledDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {transfer.actualTransferDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Actual Transfer Date
                      </label>
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {format(transfer.actualTransferDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {transfer.expectedDeliveryDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Expected Delivery
                      </label>
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {format(transfer.expectedDeliveryDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {transfer.actualDeliveryDate && (
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Actual Delivery
                      </label>
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
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
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {transfer.purpose}
                    </p>
                  </div>
                )}

                {transfer.notes && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Notes
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Transport Method
                      </label>
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {transfer.transportMethod}
                      </p>
                    </div>

                    {transfer.vehicleNumber && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Vehicle Number
                        </label>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                          {transfer.vehicleNumber}
                        </p>
                      </div>
                    )}

                    {transfer.driverName && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Driver Name
                        </label>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                          {transfer.driverName}
                        </p>
                      </div>
                    )}

                    {transfer.driverPhone && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Driver Phone
                        </label>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                          {transfer.driverPhone}
                        </p>
                      </div>
                    )}

                    {transfer.transportCost && (
                      <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Transport Cost
                        </label>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-1">
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
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                              #{index + 1}
                            </span>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.description}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Requested:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityRequested} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Approved:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityApproved} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Transferred:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityTransferred} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Unit Value:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            ₹{item.unitValue.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {(item.conditionBefore || item.conditionAfter) && (
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          {item.conditionBefore && (
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-400">Condition Before:</span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.conditionBefore}
                              </p>
                            </div>
                          )}
                          {item.conditionAfter && (
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-400">Condition After:</span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.conditionAfter}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator className="my-3" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Value:</span>
                        <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{(item.totalValue / 1000).toFixed(1)}K
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Total Transfer Value:
                  </span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{(transfer.totalValue / 100_000).toFixed(2)}L
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Discrepancies Warning */}
            {transfer.hasDiscrepancies && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Discrepancies Detected
                      </h4>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        There are discrepancies in this transfer. Please review the details carefully.
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
                  <span className="text-zinc-500 dark:text-zinc-400">Transfer Number:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {transfer.transferNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Total Items:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {transfer.lineItems.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Requested By:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    EMP-{transfer.requestedBy.toString().padStart(3, '0')}
                  </span>
                </div>
                {transfer.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Approved By:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      EMP-{transfer.approvedBy.toString().padStart(3, '0')}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Created:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(transfer.createdAt || transfer.requestDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                {transfer.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Last Updated:</span>
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
                  <CardTitle className="text-base">Temporary Transfer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {transfer.expectedReturnDate && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Expected Return:</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {format(transfer.expectedReturnDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {transfer.actualReturnDate && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Actual Return:</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 mt-1">
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
                      <span className="text-zinc-500 dark:text-zinc-400">Inspected By:</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        EMP-{transfer.inspectedBy.toString().padStart(3, '0')}
                      </p>
                    </div>
                  )}
                  {transfer.inspectedAt && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Inspection Date:</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 mt-1">
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
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
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
