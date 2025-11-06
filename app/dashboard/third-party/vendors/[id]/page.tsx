'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  Building2,
  FileText,
  Star,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// Mock data - replace with actual API call
const mockVendor = {
  id: 1,
  vendorId: 'VEN-001',
  companyName: 'ABC Materials Pvt Ltd',
  contactPerson: 'Rajesh Sharma',
  phone: '+91 98765 43210',
  email: 'contact@abcmaterials.com',
  address: '456, Industrial Area, Phase 2, Gurgaon - 122001',
  type: 'material',
  status: 'active',
  category: ['Cement', 'Steel', 'Aggregates'],
  gstNumber: '27AABCU9603R1ZX',
  panNumber: 'AABCU9603R',
  rating: 4.5,
  onTimeDeliveryRate: 92,
  totalPurchaseValue: 5500000,
  totalOrders: 45,
  totalOutstanding: 125000,
  paymentTerms: 'net30',
  bankAccount: '9876543210',
  bankName: 'HDFC Bank',
  ifscCode: 'HDFC0001234',
  registrationDate: new Date('2023-06-15'),
  website: 'www.abcmaterials.com',
  notes: 'Reliable supplier with good quality materials. Competitive pricing.',
};

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

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor] = useState(mockVendor);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {vendor.companyName}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Vendor ID: {vendor.vendorId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/third-party/vendors/${vendor.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Company Name
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.companyName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Vendor ID
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.vendorId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contact Person
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.contactPerson}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>Phone</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Website
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.website}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>Address</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Vendor Type
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {typeLabels[vendor.type]}
                      </Badge>
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
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Registration Date</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {format(vendor.registrationDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Payment Terms
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {paymentTermsLabels[vendor.paymentTerms]}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Product Categories
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Total Purchase Value
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      ₹{(vendor.totalPurchaseValue / 100000).toFixed(2)}L
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Total Orders
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.totalOrders}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Outstanding Amount
                    </label>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      ₹{(vendor.totalOutstanding / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Average Order Value
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      ₹{(vendor.totalPurchaseValue / vendor.totalOrders / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Bank Account
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {vendor.bankAccount}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {vendor.bankName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      IFSC Code
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>Rating</span>
                    </span>
                    <span className="text-sm font-bold">{vendor.rating}/5</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${(vendor.rating / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">On-Time Delivery</span>
                    <span className="text-sm font-bold">{vendor.onTimeDeliveryRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${vendor.onTimeDeliveryRate}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Orders</span>
                    <span className="text-sm font-semibold">{vendor.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Purchase Value</span>
                    <span className="text-sm font-semibold">
                      ₹{(vendor.totalPurchaseValue / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Outstanding</span>
                    <span className="text-sm font-semibold text-orange-600">
                      ₹{(vendor.totalOutstanding / 1000).toFixed(0)}K
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
                  <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                    {vendor.gstNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    PAN Number
                  </label>
                  <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
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
