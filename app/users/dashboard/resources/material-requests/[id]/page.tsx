'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/common/app-layout';
import {
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Package,
  Clock,
} from 'lucide-react';
import {
  MaterialRequestStatus,
  MaterialRequestPriority,
  materialRequestTypeLabels,
  materialRequestStatusLabels,
  materialRequestPriorityLabels,
  fulfillmentMethodLabels,
} from '@/types/resource/material-request';
import { mockMaterialRequests } from '@/components/shared/mock-data';
import { toast } from 'sonner';

// Helper functions
const getStatusBadgeColor = (status: MaterialRequestStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    under_review:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    partially_fulfilled:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    fulfilled:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[status];
};

const getPriorityBadgeColor = (priority: MaterialRequestPriority): string => {
  const colors = {
    low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    critical: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
  };
  return colors[priority];
};

const handleApprove = () => {
  toast.success('Material request approved successfully');
};

const handleReject = () => {
  toast.error('Material request rejected');
};

const handleFulfill = () => {
  toast.success('Fulfillment recorded successfully');
};

export default function MaterialRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = Number.parseInt(params.id as string);
  const mr = mockMaterialRequests.find((r) => r.id === requestId);

  if (!mr) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Material Request Not Found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                The material request you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href="/users/dashboard/resources/material-requests">
                <Button>Back to Material Requests</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this material request?')) {
      toast.success('Material request deleted successfully');
      router.push('/dashboard/resources/material-requests');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {mr.requestNumber}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Requested on {format(mr.requestDate, 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/users/dashboard/resources/material-requests/${mr.id}/edit`}
            >
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getStatusBadgeColor(mr.status)}>
            {materialRequestStatusLabels[mr.status]}
          </Badge>
          <Badge className={getPriorityBadgeColor(mr.priority)}>
            {materialRequestPriorityLabels[mr.priority]}
          </Badge>
          <Badge variant="outline">{materialRequestTypeLabels[mr.type]}</Badge>
          {mr.partialFulfillmentAllowed && (
            <Badge variant="outline" className="border-blue-500 text-blue-600">
              Partial Fulfillment Allowed
            </Badge>
          )}
        </div>

        {/* Action Buttons for Workflow */}
        {mr.status === MaterialRequestStatus.submitted && (
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {(mr.status === MaterialRequestStatus.approved ||
          mr.status === MaterialRequestStatus.partiallyFulfilled) && (
          <Button
            onClick={handleFulfill}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="mr-2 h-4 w-4" />
            Record Fulfillment
          </Button>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="space-y-6 md:col-span-2">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Purpose
                  </h3>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {mr.purpose}
                  </p>
                </div>

                {mr.justification && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500">
                        Justification
                      </h3>
                      <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                        {mr.justification}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Request Date</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(mr.requestDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Required By</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(mr.requiredByDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Requested By</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Employee #{mr.requestedBy}
                    </p>
                  </div>
                  {mr.requestedByDepartment && (
                    <div>
                      <p className="text-zinc-500">Department</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {mr.requestedByDepartment}
                      </p>
                    </div>
                  )}
                  {mr.contactPhone && (
                    <div>
                      <p className="text-zinc-500">Contact Phone</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {mr.contactPhone}
                      </p>
                    </div>
                  )}
                  {mr.contactEmail && (
                    <div>
                      <p className="text-zinc-500">Contact Email</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {mr.contactEmail}
                      </p>
                    </div>
                  )}
                </div>

                {mr.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-zinc-500">Notes</p>
                      <p className="mt-1 text-zinc-900 dark:text-zinc-100">
                        {mr.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Requested Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mr.lineItems.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {index + 1}. {item.description}
                          </h4>
                          {item.specifications && (
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {item.specifications}
                            </p>
                          )}
                        </div>
                        {item.fulfillmentMethod && (
                          <Badge variant="outline">
                            {fulfillmentMethodLabels[item.fulfillmentMethod]}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div>
                          <span className="text-zinc-500">Requested</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityRequested} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Approved</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantityApproved} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Fulfilled</span>
                          <p className="font-medium text-green-600">
                            {item.quantityFulfilled} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Pending</span>
                          <p className="font-medium text-orange-600">
                            {item.quantityPending} {item.unit}
                          </p>
                        </div>
                      </div>

                      {item.estimatedCost && (
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-zinc-500">Est. Cost</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              ₹{(item.estimatedCost / 1000).toFixed(1)}K
                            </p>
                          </div>
                          {item.actualCost !== undefined &&
                            item.actualCost > 0 && (
                              <div>
                                <span className="text-zinc-500">
                                  Actual Cost
                                </span>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                  ₹{(item.actualCost / 1000).toFixed(1)}K
                                </p>
                              </div>
                            )}
                        </div>
                      )}

                      {item.purpose && (
                        <p className="mt-2 text-sm text-zinc-500 italic">
                          Purpose: {item.purpose}
                        </p>
                      )}

                      {item.notes && (
                        <p className="mt-2 text-sm text-zinc-500">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Cost Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Estimated Total Cost
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      ₹{(mr.estimatedTotalCost / 100_000).toFixed(2)}L
                    </span>
                  </div>
                  {mr.actualTotalCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Actual Total Cost
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        ₹{(mr.actualTotalCost / 100_000).toFixed(2)}L
                      </span>
                    </div>
                  )}
                  {mr.actualTotalCost > 0 &&
                    mr.actualTotalCost !== mr.estimatedTotalCost && (
                      <div className="flex justify-between text-sm font-medium">
                        <span
                          className={
                            mr.actualTotalCost < mr.estimatedTotalCost
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          Variance
                        </span>
                        <span
                          className={
                            mr.actualTotalCost < mr.estimatedTotalCost
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {mr.actualTotalCost < mr.estimatedTotalCost
                            ? '-'
                            : '+'}
                          ₹
                          {(
                            Math.abs(
                              mr.actualTotalCost - mr.estimatedTotalCost
                            ) / 1000
                          ).toFixed(1)}
                          K
                        </span>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Approval History */}
            {(mr.approvedBy || mr.rejectedBy || mr.reviewedBy) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Approval History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mr.reviewedBy && (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Under Review
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Reviewed by Employee #{mr.reviewedBy} on{' '}
                          {format(mr.reviewedAt!, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {mr.approvedBy && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Approved
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Approved by Employee #{mr.approvedBy} on{' '}
                          {format(mr.approvedAt!, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {mr.rejectedBy && (
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Rejected
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Rejected by Employee #{mr.rejectedBy} on{' '}
                          {format(mr.rejectedAt!, 'MMM dd, yyyy')}
                        </p>
                        {mr.rejectionReason && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            Reason: {mr.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {mr.fulfilledBy && (
                    <div className="flex items-start gap-3">
                      <Package className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Fulfilled
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Fulfilled by Employee #{mr.fulfilledBy} on{' '}
                          {format(mr.fulfilledAt!, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-zinc-500">Request Number</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {mr.requestNumber}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-zinc-500">Total Items</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {mr.lineItems.length}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-zinc-500">Created At</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(mr.createdAt, 'MMM dd, yyyy')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-zinc-500">Last Updated</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(mr.updatedAt, 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Related Documents */}
            {(mr.purchaseOrderIds.length > 0 || mr.transferIds.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mr.purchaseOrderIds.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-zinc-500">
                        Purchase Orders
                      </p>
                      {mr.purchaseOrderIds.map((poId) => (
                        <Link
                          key={poId}
                          href={`/users/dashboard/resources/purchase-orders/${poId}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="mb-1 w-full justify-start"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PO #{poId}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                  {mr.transferIds.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm text-zinc-500">Transfers</p>
                      {mr.transferIds.map((transferId) => (
                        <Link
                          key={transferId}
                          href={`/users/dashboard/resources/transfers/${transferId}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="mb-1 w-full justify-start"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Transfer #{transferId}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Print Request
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
