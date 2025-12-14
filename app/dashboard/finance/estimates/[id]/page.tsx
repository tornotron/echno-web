'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/common/app-layout';
import {
  FileText,
  Edit,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Building,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Estimate,
  EstimateStatus,
  EstimateCategory,
} from '@/types/finance/estimate';

// Mock data - replace with actual API call
const mockEstimate: Estimate = {
  id: 1,
  estimateNumber: 'EST-2024-0001',
  title: 'Residential Building Construction',
  status: EstimateStatus.approved,
  category: EstimateCategory.construction,

  // Client Info
  clientName: 'John Doe',
  clientEmail: 'john.doe@example.com',
  clientPhone: '+91 98765 43210',
  clientAddress: '123 Main Street, Mumbai, Maharashtra 400001',

  // Project Details
  projectLocation: 'Plot No. 456, Andheri East, Mumbai',
  projectDescription:
    'Construction of 4-storey residential building with 8 apartments',
  scope:
    'Complete construction including civil, electrical, plumbing, and interior work',
  assumptions: 'Client will provide all necessary approvals and clearances',
  exclusions: 'Furniture and fixtures are not included',

  // Timeline
  estimatedStartDate: new Date('2024-12-01'),
  estimatedEndDate: new Date('2025-11-30'),
  estimatedDuration: 365,

  // Line Items
  lineItems: [
    {
      id: 1,
      category: 'Materials',
      description: 'Cement, Sand, Aggregate',
      specifications: 'Grade M25 concrete',
      quantity: 500,
      unit: 'cum',
      unitRate: 8500,
      laborCost: 200_000,
      materialCost: 4_050_000,
      equipmentCost: 0,
      overhead: 10,
      profit: 15,
      subtotal: 4_250_000,
      total: 4_890_625,
    },
    {
      id: 2,
      category: 'Labor',
      description: 'Skilled and unskilled labor',
      specifications: 'As per industry standards',
      quantity: 1,
      unit: 'lump sum',
      unitRate: 800_000,
      laborCost: 800_000,
      materialCost: 0,
      equipmentCost: 50_000,
      overhead: 10,
      profit: 15,
      subtotal: 850_000,
      total: 977_500,
    },
  ],

  // Cost Summary
  materialCost: 4_050_000,
  laborCost: 1_000_000,
  equipmentCost: 50_000,
  subcontractorCost: 0,
  overheadCost: 510_000,
  profitMargin: 765_000,
  subtotal: 5_375_000,

  // Adjustments
  contingency: 5,
  contingencyAmount: 266_781,
  taxRate: 18,
  taxAmount: 1_011_081,
  totalAmount: 6_245_344,

  // Payment Terms
  paymentTerms:
    '30% advance, 40% on completion of structure, 30% on completion',
  advancePayment: 30,
  milestonePayments: [
    { milestone: 'Foundation work', percentage: 20, amount: 1_249_069 },
    { milestone: 'Structure completion', percentage: 40, amount: 2_498_138 },
    { milestone: 'Finishing work', percentage: 30, amount: 1_873_603 },
    { milestone: 'Final handover', percentage: 10, amount: 624_534 },
  ],

  // Documents
  attachments: [],

  // Terms
  termsAndConditions:
    'All work to be completed as per approved drawings and specifications',
  warrantyTerms: '1 year defect liability period',
  notes: 'Price valid for 30 days from estimate date',

  // Dates
  preparedDate: new Date('2024-11-01'),
  validityPeriod: 30,
  expiryDate: new Date('2024-12-01'),

  // Workflow
  preparedBy: 1,
  reviewedBy: 2,
  approvedBy: 3,

  // Audit
  createdBy: 1,
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2024-11-05'),
  version: 1,
};

const statusLabels: Record<EstimateStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  sent: 'Sent to Client',
  approved: 'Approved',
  rejected: 'Rejected',
  revised: 'Revised',
  converted: 'Converted to Project',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const categoryLabels: Record<EstimateCategory, string> = {
  construction: 'Construction',
  renovation: 'Renovation',
  maintenance: 'Maintenance',
  consulting: 'Consulting',
  design: 'Design',
  mixed: 'Mixed',
};

const getStatusBadgeColor = (status: EstimateStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    approved:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    revised:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    converted:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    expired: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[status];
};

const handleDownload = () => {
  toast.info('Download functionality coming soon');
};

const handleSend = () => {
  toast.info('Send to client functionality coming soon');
};

const handleApprove = () => {
  toast.success('Estimate approved successfully');
};

const handleReject = () => {
  toast.error('Estimate rejected');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ViewEstimatePage() {
  const params = useParams();
  const router = useRouter();
  const [estimate] = useState<Estimate>(mockEstimate);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (
      !confirm(
        'Are you sure you want to delete this estimate? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: Implement actual delete API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Estimate deleted successfully');
      router.push('/dashboard/finance/estimates');
    } catch {
      toast.error('Failed to delete estimate');
      setIsDeleting(false);
    }
  }, [router]);

  if (!estimate) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Estimate not found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                The estimate you&apos;re looking for doesn&apos;t exist or has
                been removed.
              </p>
              <Button asChild>
                <Link href="/dashboard/finance/estimates">
                  Back to Estimates
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                {estimate.estimateNumber}
              </h1>
              <Badge className={getStatusBadgeColor(estimate.status)}>
                {statusLabels[estimate.status]}
              </Badge>
              <Badge variant="outline">
                {categoryLabels[estimate.category]}
              </Badge>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {estimate.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {estimate.status === 'draft' && (
              <Button variant="outline" size="sm" onClick={handleSend}>
                <Send className="mr-2 h-4 w-4" />
                Send to Client
              </Button>
            )}
            {estimate.status === 'sent' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/finance/estimates/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Client Name
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.clientName}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      <Mail className="h-3 w-3" />
                      Email
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.clientEmail}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      <Phone className="h-3 w-3" />
                      Phone
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.clientPhone}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      <Building className="h-3 w-3" />
                      Address
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.clientAddress}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Location
                  </label>
                  <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {estimate.projectLocation}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Description
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {estimate.projectDescription}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Scope of Work
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {estimate.scope}
                  </p>
                </div>
                {estimate.assumptions && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Assumptions
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {estimate.assumptions}
                    </p>
                  </div>
                )}
                {estimate.exclusions && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Exclusions
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {estimate.exclusions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Start Date
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.estimatedStartDate &&
                        format(estimate.estimatedStartDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      End Date
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.estimatedEndDate &&
                        format(estimate.estimatedEndDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Duration
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.estimatedDuration} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estimate.lineItems.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {item.description}
                            </span>
                          </div>
                          {item.specifications && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {item.specifications}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(item.total)}
                        </p>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div>
                          <span className="text-zinc-500">Quantity:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Unit Rate:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.unitRate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Labor:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.laborCost || 0)}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Material:</span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.materialCost || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            {estimate.milestonePayments &&
              estimate.milestonePayments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estimate.milestonePayments.map((milestone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {milestone.milestone}
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {milestone.percentage}% of total
                            </p>
                          </div>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(milestone.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {estimate.paymentTerms && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Payment Terms
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {estimate.paymentTerms}
                    </p>
                  </div>
                )}
                {estimate.termsAndConditions && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Terms
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {estimate.termsAndConditions}
                    </p>
                  </div>
                )}
                {estimate.warrantyTerms && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Warranty
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {estimate.warrantyTerms}
                    </p>
                  </div>
                )}
                {estimate.notes && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Notes
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {estimate.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Material Cost
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.materialCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Labor Cost
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.laborCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Equipment Cost
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.equipmentCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Overhead
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.overheadCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Profit
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.profitMargin)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Contingency ({estimate.contingency}%)
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.contingencyAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Tax ({estimate.taxRate}%)
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(estimate.taxAmount)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Grand Total
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(estimate.totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Validity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Validity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Prepared Date
                  </label>
                  <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {format(estimate.preparedDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Valid Until
                  </label>
                  <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {estimate.expiryDate &&
                      format(estimate.expiryDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Validity Period
                  </label>
                  <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {estimate.validityPeriod} days
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Workflow */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estimate.preparedBy && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Prepared By
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.preparedBy}
                    </p>
                  </div>
                )}
                {estimate.reviewedBy && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Reviewed By
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.reviewedBy}
                    </p>
                  </div>
                )}
                {estimate.approvedBy && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Approved By
                    </label>
                    <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {estimate.approvedBy}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
