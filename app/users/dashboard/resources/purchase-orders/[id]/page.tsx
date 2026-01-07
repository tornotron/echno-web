'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Trash2,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  FileText,
  Building2,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  Receipt,
  CreditCard,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  PurchaseOrderStatus,
  DeliveryStatus,
  purchaseOrderTypeLabels,
  purchaseOrderStatusLabels,
  deliveryStatusLabels,
} from '@/types/resource/purchase-order';
import { mockPurchaseOrders } from '@/components/shared/mock-data';
import { toast } from '@/lib/styles/toast-styles';

// Helper functions
const getPOStatusBadgeColor = (status: PurchaseOrderStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    sent: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    acknowledged:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    partially_received:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    received:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    partially_invoiced:
      'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    invoiced: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    completed:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

const getDeliveryStatusBadgeColor = (status: DeliveryStatus): string => {
  const colors = {
    pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    in_transit:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    partially_delivered:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    delivered:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    delayed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

const handleApprove = () => {
  toast.success('Purchase order approved successfully');
};

const handleReject = () => {
  toast.error('Purchase order rejected');
};

const handleSendToVendor = () => {
  toast.success('Purchase order sent to vendor');
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = Number.parseInt(params.id as string);
  const po = mockPurchaseOrders.find((p) => p.id === poId);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      toast.success('Purchase order deleted successfully');
      router.push('/dashboard/resources/purchase-orders');
    }
  }, [router]);

  if (!po) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Purchase Order Not Found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              The purchase order you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/users/dashboard/resources/purchase-orders">
              <Button>Back to Purchase Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {po.poNumber}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Created on {format(po.poDate, 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/users/dashboard/resources/purchase-orders/${po.id}/edit`}
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
        <Badge className={getPOStatusBadgeColor(po.status)}>
          {purchaseOrderStatusLabels[po.status]}
        </Badge>
        <Badge className={getDeliveryStatusBadgeColor(po.deliveryStatus)}>
          {deliveryStatusLabels[po.deliveryStatus]}
        </Badge>
        <Badge variant="outline">{purchaseOrderTypeLabels[po.type]}</Badge>
        {po.advancePaymentRequired && (
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-600"
          >
            <AlertCircle className="mr-1 h-3 w-3" />
            Advance Payment Required
          </Badge>
        )}
      </div>

      {/* Action Buttons for Workflow */}
      {po.status === PurchaseOrderStatus.pending && (
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

      {po.status === PurchaseOrderStatus.approved && (
        <Button
          onClick={handleSendToVendor}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Send className="mr-2 h-4 w-4" />
          Send to Vendor
        </Button>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 md:col-span-2">
          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {po.vendorName}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Contact: {po.vendorContactPerson}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500">Phone</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {po.vendorPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500">Email</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {po.vendorEmail}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500">Address</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {po.vendorAddress}
                    </p>
                  </div>
                </div>
                {po.vendorGstNumber && (
                  <div className="col-span-2">
                    <p className="text-zinc-500">GST Number</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {po.vendorGstNumber}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {po.lineItems.map((item, index) => (
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
                      <div className="text-right">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{(item.total / 1000).toFixed(2)}K
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-zinc-500">Quantity</span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Unit Price</span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          ₹{item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">
                          Tax ({item.taxRate}%)
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          ₹{(item.taxAmount / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Received</span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.quantityReceived}/{item.quantity}
                        </p>
                      </div>
                    </div>

                    {item.quantityPending > 0 && (
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className="border-orange-500 text-orange-600"
                        >
                          Pending: {item.quantityPending} {item.unit}
                        </Badge>
                      </div>
                    )}

                    {item.notes && (
                      <p className="mt-2 text-sm text-zinc-500 italic dark:text-zinc-500">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Financial Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Subtotal
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{(po.subtotal / 100_000).toFixed(2)}L
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Tax Amount
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{(po.taxAmount / 100_000).toFixed(2)}L
                  </span>
                </div>
                {po.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-₹{(po.discountAmount / 1000).toFixed(1)}K</span>
                  </div>
                )}
                {po.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Shipping Cost
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      ₹{(po.shippingCost / 1000).toFixed(1)}K
                    </span>
                  </div>
                )}
                {po.otherCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Other Charges
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      ₹{(po.otherCharges / 1000).toFixed(1)}K
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Total Amount
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    ₹{(po.totalAmount / 100_000).toFixed(2)}L
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-zinc-500">Delivery Address</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {po.deliveryAddress}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Expected Delivery</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {po.expectedDeliveryDate
                      ? format(po.expectedDeliveryDate, 'MMM dd, yyyy')
                      : 'TBD'}
                  </p>
                </div>
                {po.actualDeliveryDate && (
                  <div>
                    <p className="text-sm text-zinc-500">Actual Delivery</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(po.actualDeliveryDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {po.qualityCheckRequired && (
                <div>
                  <p className="text-sm text-zinc-500">Quality Check</p>
                  <Badge
                    className={
                      po.qualityCheckStatus === 'passed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {po.qualityCheckStatus === 'passed'
                      ? 'Passed'
                      : po.qualityCheckStatus || 'Required'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goods Receipts (GRN) */}
          {po.goodsReceiptIds && po.goodsReceiptIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Goods Receipts ({po.goodsReceiptIds.length})
                  </span>
                  <Badge
                    className={
                      po.receiptStatus === 'fully_received'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }
                  >
                    {po.receiptStatus?.replaceAll('_', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {po.goodsReceiptIds.map((grnId, index) => (
                    <div key={grnId} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            GRN #{grnId}
                          </p>
                          <p className="text-sm text-zinc-500">
                            Receipt {index + 1} of {po.goodsReceiptIds.length}
                          </p>
                        </div>
                        <Link
                          href={`/users/dashboard/resources/goods-receipts/${grnId}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Receipt className="mr-2 h-4 w-4" />
                    Record New Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock Adjustments */}
          {po.stockAdjustmentIds && po.stockAdjustmentIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Stock Adjustments ({po.stockAdjustmentIds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {po.stockAdjustmentIds.map((adjId) => (
                    <div
                      key={adjId}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-medium">
                          Adjustment #{adjId}
                        </span>
                      </div>
                      <Link
                        href={`/users/dashboard/resources/stock-adjustments/${adjId}`}
                      >
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </span>
                <Badge
                  className={
                    po.paymentStatus === 'fully_paid'
                      ? 'bg-green-100 text-green-700'
                      : po.paymentStatus === 'partially_paid'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-zinc-100 text-zinc-700'
                  }
                >
                  {po.paymentStatus?.replaceAll('_', ' ').toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Summary */}
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Amount
                    </span>
                    <span className="font-medium">
                      ₹{(po.totalAmount / 100_000).toFixed(2)}L
                    </span>
                  </div>
                  {po.totalPaid > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Amount Paid
                        </span>
                        <span className="font-medium text-green-600">
                          ₹{(po.totalPaid / 100_000).toFixed(2)}L
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Balance Due</span>
                        <span className="font-bold text-orange-600">
                          ₹{(po.balanceAmount / 100_000).toFixed(2)}L
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Payment Terms</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {po.paymentTerms || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Payment Method</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {po.paymentMethod || 'Not specified'}
                  </p>
                </div>
              </div>

              {po.advancePaymentRequired && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Advance Payment Required
                      </p>
                      <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                        {po.advancePaymentPercentage}% of total amount = ₹
                        {(po.advancePaymentAmount! / 100_000).toFixed(2)}L
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Records */}
              {po.paymentIds && po.paymentIds.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Payment Records ({po.paymentIds.length})
                  </p>
                  {po.paymentIds.map((paymentId) => (
                    <div
                      key={paymentId}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-medium">
                          Payment #{paymentId}
                        </span>
                      </div>
                      <Link
                        href={`/users/dashboard/finance/payments/${paymentId}`}
                      >
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                <p className="text-zinc-500">PO Number</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {po.poNumber}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-zinc-500">PO Date</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {format(po.poDate, 'MMM dd, yyyy')}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-zinc-500">Created By</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Employee #{po.createdBy}
                </p>
              </div>
              {po.approvedBy && (
                <>
                  <Separator />
                  <div>
                    <p className="text-zinc-500">Approved By</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Employee #{po.approvedBy}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(po.approvedAt!, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </>
              )}
              {po.vendorPoNumber && (
                <>
                  <Separator />
                  <div>
                    <p className="text-zinc-500">Vendor PO Number</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {po.vendorPoNumber}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
                <Send className="mr-2 h-4 w-4" />
                Email to Vendor
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Record Receipt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
