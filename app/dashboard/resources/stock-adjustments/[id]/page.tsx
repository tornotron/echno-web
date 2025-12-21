'use client';

import { use, useState } from 'react';

import { useRouter } from 'next/navigation';
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
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data - in real app, this would come from the API
const mockStockAdjustments = [
  {
    id: 1,
    adjustmentNumber: 'SA-2024-001',
    adjustmentType: 'Physical Count',
    adjustmentDate: new Date('2024-01-15'),
    reason: 'Annual stock verification',
    location: 'Warehouse A',
    status: 'Completed',
    createdBy: 15,
    approvedBy: 3,
    approvedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    notes:
      'Annual physical count completed. Minor discrepancies found in Zone B.',
    items: [
      {
        id: 1,
        description: 'Portland Cement - Grade 43',
        currentStock: 500,
        countedStock: 485,
        difference: -15,
        unit: 'bags',
        unitCost: 350,
        totalImpact: -5250,
        reason: 'Damaged bags found during inspection',
      },
      {
        id: 2,
        description: 'Steel Rebar 12mm',
        currentStock: 1200,
        countedStock: 1215,
        difference: 15,
        unit: 'pcs',
        unitCost: 65,
        totalImpact: 975,
        reason: 'Miscount in previous entry',
      },
      {
        id: 3,
        description: 'Paint - White Exterior',
        currentStock: 100,
        countedStock: 95,
        difference: -5,
        unit: 'L',
        unitCost: 180,
        totalImpact: -900,
        reason: 'Shrinkage/evaporation',
      },
    ],
  },
];

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
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-zinc-400 dark:text-zinc-600" />
            <div className="text-zinc-500 dark:text-zinc-400">
              Stock Adjustment not found
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleEdit = () => {
    router.push(`/dashboard/resources/stock-adjustments/${id}/edit`);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Stock Adjustment deleted successfully');
      router.push('/dashboard/resources/stock-adjustments');
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

  const totalImpact = adjustment.items.reduce(
    (sum, item) => sum + item.totalImpact,
    0
  );
  const surplusItems = adjustment.items.filter(
    (item) => item.difference > 0
  ).length;
  const shortageItems = adjustment.items.filter(
    (item) => item.difference < 0
  ).length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                {adjustment.adjustmentNumber}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Created {format(adjustment.createdAt, 'PPP')}
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
            <Badge variant="outline">{adjustment.adjustmentType}</Badge>
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
                      {adjustment.adjustmentType}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Location
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {adjustment.location}
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
                    {adjustment.reason}
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

            {/* Adjustment Items */}
            <Card>
              <CardHeader>
                <CardTitle>Adjustment Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adjustment.items.map((item, index) => (
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
                            item.difference > 0
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : item.difference < 0
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                          }
                        >
                          {item.difference > 0 ? '+' : ''}
                          {item.difference} {item.unit}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-zinc-500 dark:text-zinc-400">
                            Current Stock
                          </div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.currentStock} {item.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500 dark:text-zinc-400">
                            Counted Stock
                          </div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.countedStock} {item.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500 dark:text-zinc-400">
                            Unit Cost
                          </div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            ₹{item.unitCost.toLocaleString()}
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
                            item.totalImpact > 0
                              ? 'text-green-600 dark:text-green-400'
                              : item.totalImpact < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {item.totalImpact > 0 ? '+' : ''}₹
                          {item.totalImpact.toLocaleString()}
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
                      {adjustment.items.length}
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
                      EMP-{adjustment.createdBy.toString().padStart(3, '0')}
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
                      {format(adjustment.createdAt, 'PPP')}
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
    </AppLayout>
  );
}
