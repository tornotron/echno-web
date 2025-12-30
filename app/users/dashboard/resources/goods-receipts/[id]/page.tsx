'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/common/app-layout';
import {
  Receipt,
  Package,
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  ShoppingCart,
  Image as ImageIcon,
} from 'lucide-react';
import {
  GoodsReceiptStatus,
  DiscrepancyType,
  goodsReceiptStatusLabels,
  goodsReceiptStatusColors,
  discrepancyTypeLabels,
  discrepancyTypeColors,
} from '@/types/resource/goods-receipt';
import { LocationType, getLocationTypeLabel } from '@/types/resource/location';
import {
  mockGoodsReceipts,
  mockVendors,
  mockLocations,
} from '@/components/shared/mock-data';

const getStatusBadgeColor = (status: GoodsReceiptStatus): string => {
  const baseColors = goodsReceiptStatusColors[status];
  const colors = {
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    orange:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };
  return colors[baseColors as keyof typeof colors] || colors.zinc;
};

const getDiscrepancyBadgeColor = (type: DiscrepancyType): string => {
  const baseColors = discrepancyTypeColors[type];
  const colors = {
    red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    orange:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    yellow:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    purple:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };
  return colors[baseColors as keyof typeof colors] || colors.red;
};

export default function GoodsReceiptDetailPage() {
  const params = useParams();
  const grnId = Number.parseInt(params.id as string);
  const grn = mockGoodsReceipts.find((g) => g.id === grnId);
  const vendor = grn ? mockVendors.find((v) => v.id === grn.vendorId) : null;
  const location = grn
    ? mockLocations.find((l) => l.id === grn.destinationLocationId)
    : null;

  if (!grn) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Receipt className="mx-auto h-12 w-12 text-zinc-400" />
            <h2 className="mt-4 text-xl font-semibold">
              Goods Receipt Not Found
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              The goods receipt you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/users/dashboard/resources/goods-receipts">
              <Button className="mt-4">Back to Goods Receipts</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {grn.receiptNumber}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Goods Receipt Note Details
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusBadgeColor(grn.status)}>
              {goodsReceiptStatusLabels[grn.status]}
            </Badge>
          </div>
        </div>

        {/* Discrepancy Alert */}
        {grn.hasDiscrepancies && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Discrepancies Detected
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {grn.discrepancyNotes}
                  </p>
                  <div className="mt-3 flex gap-4 text-sm">
                    {grn.totalShortage > 0 && (
                      <div>
                        <span className="text-red-600">Shortage:</span>{' '}
                        <span className="font-medium">
                          {grn.totalShortage} units
                        </span>
                      </div>
                    )}
                    {grn.totalDamage > 0 && (
                      <div>
                        <span className="text-red-600">Damaged:</span>{' '}
                        <span className="font-medium">
                          {grn.totalDamage} units
                        </span>
                      </div>
                    )}
                    {grn.totalExcess > 0 && (
                      <div>
                        <span className="text-blue-600">Excess:</span>{' '}
                        <span className="font-medium">
                          {grn.totalExcess} units
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Receipt Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Receipt Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Receipt Date</p>
                    <p className="font-medium">
                      {format(grn.receivedDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Received By</p>
                    <p className="font-medium">
                      {grn.receivedByName || `User #${grn.receivedBy}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Purchase Order</p>
                    <Link
                      href={`/users/dashboard/resources/purchase-orders/${grn.purchaseOrderId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      PO-{grn.purchaseOrderId}
                    </Link>
                  </div>
                  {grn.invoiceId && (
                    <div>
                      <p className="text-sm text-zinc-500">Invoice</p>
                      <Link
                        href={`/users/dashboard/finance/invoices/${grn.invoiceId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Invoice #{grn.invoiceId}
                      </Link>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                  <h4 className="mb-3 font-semibold">Financial Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Order Value
                      </span>
                      <span className="font-medium">
                        ₹{(grn.totalOrderValue / 100_000).toFixed(2)}L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Received Value
                      </span>
                      <span className="font-medium">
                        ₹{(grn.totalReceivedValue / 100_000).toFixed(2)}L
                      </span>
                    </div>
                    {grn.valueVariance !== 0 && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Variance</span>
                        <span
                          className={`font-bold ${grn.valueVariance < 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {grn.valueVariance > 0 ? '+' : ''}₹
                          {(grn.valueVariance / 100_000).toFixed(2)}L
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Received Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grn.lineItems.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {index + 1}. {item.description}
                          </h4>
                          {item.hasDiscrepancy && item.discrepancyType && (
                            <Badge
                              className={`mt-2 ${getDiscrepancyBadgeColor(item.discrepancyType)}`}
                            >
                              {discrepancyTypeLabels[item.discrepancyType]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Ordered</p>
                          <p className="font-medium">
                            {item.orderedQuantity} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Received</p>
                          <p className="font-medium">
                            {item.receivedQuantity} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Accepted</p>
                          <p className="font-medium text-green-600">
                            {item.acceptedQuantity} {item.unit}
                          </p>
                        </div>
                      </div>

                      {(item.rejectedQuantity > 0 ||
                        item.damageQuantity > 0 ||
                        item.shortageQuantity > 0) && (
                        <div className="mt-3 rounded bg-red-50 p-3 dark:bg-red-900/20">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            {item.rejectedQuantity > 0 && (
                              <div>
                                <p className="text-red-600">Rejected</p>
                                <p className="font-medium">
                                  {item.rejectedQuantity} {item.unit}
                                </p>
                              </div>
                            )}
                            {item.damageQuantity > 0 && (
                              <div>
                                <p className="text-red-600">Damaged</p>
                                <p className="font-medium">
                                  {item.damageQuantity} {item.unit}
                                </p>
                              </div>
                            )}
                            {item.shortageQuantity > 0 && (
                              <div>
                                <p className="text-red-600">Shortage</p>
                                <p className="font-medium">
                                  {item.shortageQuantity} {item.unit}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quality Check */}
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        {item.qualityCheckPassed ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              Quality Check Passed
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">
                              Quality Check Failed
                            </span>
                          </>
                        )}
                      </div>

                      {item.qualityNotes && (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          {item.qualityNotes}
                        </p>
                      )}

                      {item.discrepancyNotes && (
                        <div className="mt-2 rounded bg-orange-50 p-2 text-sm dark:bg-orange-900/20">
                          <p className="text-orange-700 dark:text-orange-300">
                            {item.discrepancyNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Check Details */}
            {grn.qualityCheckRequired && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Quality Inspection
                    </span>
                    <Badge
                      className={
                        grn.qualityCheckPassed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {grn.qualityCheckStatus?.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {grn.inspectedBy && (
                    <div>
                      <p className="text-sm text-zinc-500">Inspected By</p>
                      <p className="font-medium">
                        Inspector #{grn.inspectedBy}
                      </p>
                      {grn.inspectedAt && (
                        <p className="text-sm text-zinc-500">
                          {format(grn.inspectedAt, 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  )}
                  {grn.qualityNotes && (
                    <div>
                      <p className="text-sm text-zinc-500">Quality Notes</p>
                      <p className="text-sm">{grn.qualityNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link
                  href={`/users/dashboard/resources/purchase-orders/${grn.purchaseOrderId}`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Purchase Order
                  </Button>
                </Link>
                {grn.stockAdjustmentId && (
                  <Link
                    href={`/users/dashboard/resources/stock-adjustments/${grn.stockAdjustmentId}`}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Stock Adjustment
                    </Button>
                  </Link>
                )}
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Download GRN
                </Button>
              </CardContent>
            </Card>

            {/* Vendor Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendor ? (
                  <Link
                    href={`/users/dashboard/third-party/vendors/${vendor.id}`}
                    className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                      <span className="text-sm font-medium text-white">
                        {vendor.companyName?.charAt(0) || 'V'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {vendor.companyName}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {vendor.contactPerson}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <p className="font-medium">Vendor #{grn.vendorId}</p>
                )}
                {grn.vendorNotified && grn.vendorNotifiedAt && (
                  <div className="mt-3 text-sm">
                    <p className="text-zinc-500">Notified on</p>
                    <p>{format(grn.vendorNotifiedAt, 'MMM dd, yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Destination
                </CardTitle>
              </CardHeader>
              <CardContent>
                {location ? (
                  <Link
                    href={`/users/dashboard/resources/locations/${location.id}`}
                    className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-green-600">
                      <span className="text-sm font-medium text-white">
                        {location.name?.charAt(0) || 'L'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {location.name}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {getLocationTypeLabel(location.type as LocationType)}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm">
                    Location #{grn.destinationLocationId}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Documentation */}
            {(grn.photos || grn.documents) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {grn.photos && grn.photos.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-zinc-500">
                        Photos ({grn.photos.length})
                      </p>
                      <div className="space-y-1">
                        {grn.photos.map((photo, i) => (
                          <p key={i} className="text-sm text-blue-600">
                            {photo}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {grn.documents && grn.documents.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-zinc-500">
                        Documents ({grn.documents.length})
                      </p>
                      <div className="space-y-1">
                        {grn.documents.map((doc, i) => (
                          <p key={i} className="text-sm text-blue-600">
                            {doc}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
