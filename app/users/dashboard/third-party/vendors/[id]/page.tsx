'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  Building2,
  Star,
  FileText,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { mockVendors } from '@/components/shared/mock-data';

const typeLabels: Record<string, string> = {
  material: 'Material Supplier',
  equipment: 'Equipment',
  service: 'Service Provider',
  transport: 'Transport',
  mixed: 'Mixed',
};

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'zinc',
  blacklisted: 'red',
  pending: 'orange',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted',
  pending: 'Pending',
};

const paymentTermsLabels: Record<string, string> = {
  immediate: 'Immediate',
  net15: 'Net 15 Days',
  net30: 'Net 30 Days',
  net45: 'Net 45 Days',
  net60: 'Net 60 Days',
  custom: 'Custom',
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const vendorId = Number.parseInt(unwrappedParams.id);
  const vendor = mockVendors.find((v) => v.id === vendorId);

  if (!vendor) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold">Vendor Not Found</h2>
          <p className="mb-4 text-zinc-500">
            The vendor with ID &quot;{unwrappedParams.id}&quot; could not be
            found.
          </p>
          <Button onClick={() => router.push('/dashboard/third-party/vendors')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {vendor.companyName}
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Vendor ID: {vendor.vendorId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/users/dashboard/third-party/vendors/${vendor.id}/edit`}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Company Name
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.companyName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Vendor ID
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.vendorId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contact Person
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.contactPerson}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-3 w-3" />
                      <span>Phone</span>
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.phone}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Website
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.website}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      <span>Address</span>
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Business Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Vendor Type
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">{typeLabels[vendor.type]}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={`bg-${statusColors[vendor.status]}-100 text-${statusColors[vendor.status]}-700 dark:bg-${statusColors[vendor.status]}-900 dark:text-${statusColors[vendor.status]}-300`}
                      >
                        {statusLabels[vendor.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      <span>Contract Start Date</span>
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.contractStartDate
                        ? format(vendor.contractStartDate, 'MMM dd, yyyy')
                        : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Payment Terms
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {paymentTermsLabels[vendor.paymentTerms]}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Product Categories
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {vendor.category.map((cat, idx) => (
                        <Badge key={idx} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Total Purchase Value
                    </label>
                    <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {vendor.totalPurchaseValue
                        ? `₹${(vendor.totalPurchaseValue / 100_000).toFixed(2)}L`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Total Orders
                    </label>
                    <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {vendor.totalOrders ?? 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Outstanding Amount
                    </label>
                    <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
                      {vendor.totalOutstanding
                        ? `₹${(vendor.totalOutstanding / 1000).toFixed(0)}K`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Average Order Value
                    </label>
                    <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {vendor.totalPurchaseValue && vendor.totalOrders
                        ? `₹${(vendor.totalPurchaseValue / vendor.totalOrders / 1000).toFixed(0)}K`
                        : '-'}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Bank Account
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.accountNumber || 'Not provided'}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {vendor.bankName || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      IFSC Code
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {vendor.ifscCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-sm text-zinc-600 dark:text-zinc-400">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>Rating</span>
                    </span>
                    <span className="text-sm font-bold">
                      {vendor.rating ?? 0}/5
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${((vendor.rating ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      On-Time Delivery
                    </span>
                    <span className="text-sm font-bold">
                      {vendor.onTimeDeliveryRate}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${vendor.onTimeDeliveryRate}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Total Orders
                    </span>
                    <span className="text-sm font-semibold">
                      {vendor.totalOrders ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Purchase Value
                    </span>
                    <span className="text-sm font-semibold">
                      {vendor.totalPurchaseValue
                        ? `₹${(vendor.totalPurchaseValue / 100_000).toFixed(2)}L`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Outstanding
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      {vendor.totalOutstanding
                        ? `₹${(vendor.totalOutstanding / 1000).toFixed(0)}K`
                        : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax & Legal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Tax & Legal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    GST Number
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {vendor.gstNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    PAN Number
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {vendor.panNumber}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {vendor.notes}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
