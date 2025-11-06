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
  Briefcase,
  TrendingUp,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// Mock data - replace with actual API call
const mockSubContract = {
  id: 1,
  contractId: 'SUB-001',
  contractorName: 'Elite Construction Services',
  contactPerson: 'Amit Patel',
  phone: '+91 98765 43210',
  email: 'amit@eliteconstruction.com',
  address: '789, Contractor Colony, Sector 15, Noida - 201301',
  workType: 'construction',
  status: 'active',
  contractStatus: 'in-progress',
  scope: 'Foundation and structural work for Building A',
  contractValue: 2500000,
  paidAmount: 1500000,
  pendingAmount: 1000000,
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-06-30'),
  duration: 167,
  completionPercentage: 60,
  gstNumber: '09AABCU9603R1ZX',
  panNumber: 'AABCU9603R',
  bankAccount: '1234567890',
  bankName: 'ICICI Bank',
  ifscCode: 'ICIC0001234',
  contractDate: new Date('2024-01-10'),
  paymentTerms: 'milestone',
  milestones: [
    { name: 'Foundation Work', percentage: 30, amount: 750000, status: 'completed', date: '2024-02-28' },
    { name: 'Ground Floor Structure', percentage: 40, amount: 1000000, status: 'completed', date: '2024-04-15' },
    { name: 'First Floor Structure', percentage: 30, amount: 750000, status: 'in-progress', date: '2024-06-30' },
  ],
  notes: 'Experienced contractor with good track record. Regular progress updates provided.',
};

const workTypeLabels: Record<string, string> = {
  construction: 'Construction',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  painting: 'Painting',
  hvac: 'HVAC',
  landscaping: 'Landscaping',
  other: 'Other',
};

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'zinc',
  suspended: 'red',
  completed: 'blue',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  completed: 'Completed',
};

const contractStatusColors: Record<string, string> = {
  draft: 'zinc',
  'in-progress': 'blue',
  completed: 'green',
  cancelled: 'red',
  onhold: 'orange',
};

const contractStatusLabels: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  onhold: 'On Hold',
};

const milestoneStatusIcons: Record<string, any> = {
  completed: CheckCircle2,
  'in-progress': Clock,
  pending: AlertCircle,
};

const milestoneStatusColors: Record<string, string> = {
  completed: 'text-green-600',
  'in-progress': 'text-blue-600',
  pending: 'text-orange-600',
};

export default function SubContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subContract] = useState(mockSubContract);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {subContract.contractorName}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Contract ID: {subContract.contractId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/third-party/sub-contracts/${subContract.id}/edit`}>
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
                  <User className="h-5 w-5" />
                  <span>Contractor Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contractor Name
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.contractorName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contract ID
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.contractId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contact Person
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.contactPerson}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>Phone</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Work Type
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {workTypeLabels[subContract.workType]}
                      </Badge>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>Address</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Contract Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={`bg-${statusColors[subContract.status]}-100 text-${statusColors[subContract.status]}-700 dark:bg-${statusColors[subContract.status]}-900 dark:text-${statusColors[subContract.status]}-300`}
                      >
                        {statusLabels[subContract.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contract Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={`bg-${contractStatusColors[subContract.contractStatus]}-100 text-${contractStatusColors[subContract.contractStatus]}-700 dark:bg-${contractStatusColors[subContract.contractStatus]}-900 dark:text-${contractStatusColors[subContract.contractStatus]}-300`}
                      >
                        {contractStatusLabels[subContract.contractStatus]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Contract Date</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {format(subContract.contractDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Payment Terms
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1 capitalize">
                      {subContract.paymentTerms}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Start Date
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {format(subContract.startDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      End Date
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {format(subContract.endDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Duration
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.duration} days
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Completion
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${subContract.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{subContract.completionPercentage}%</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Scope of Work
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.scope}
                    </p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contract Value
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      ₹{(subContract.contractValue / 100000).toFixed(2)}L
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Paid Amount
                    </label>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                      ₹{(subContract.paidAmount / 100000).toFixed(2)}L
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Pending Amount
                    </label>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      ₹{(subContract.pendingAmount / 100000).toFixed(2)}L
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
                      {subContract.bankAccount}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {subContract.bankName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      IFSC Code
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {subContract.ifscCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Progress</span>
                    <span className="text-sm font-bold">{subContract.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${subContract.completionPercentage}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Contract Value</span>
                    <span className="text-sm font-semibold">
                      ₹{(subContract.contractValue / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Paid</span>
                    <span className="text-sm font-semibold text-green-600">
                      ₹{(subContract.paidAmount / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Pending</span>
                    <span className="text-sm font-semibold text-orange-600">
                      ₹{(subContract.pendingAmount / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Duration</span>
                    <span className="text-sm font-semibold">{subContract.duration} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Project Milestones</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subContract.milestones.map((milestone, idx) => {
                    const StatusIcon = milestoneStatusIcons[milestone.status];
                    return (
                      <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <StatusIcon className={`h-4 w-4 ${milestoneStatusColors[milestone.status]}`} />
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                            {milestone.name}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Due: {milestone.date}
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {milestone.percentage}% • ₹{(milestone.amount / 100000).toFixed(2)}L
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                    {subContract.gstNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    PAN Number
                  </label>
                  <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                    {subContract.panNumber}
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
                  {subContract.notes}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
