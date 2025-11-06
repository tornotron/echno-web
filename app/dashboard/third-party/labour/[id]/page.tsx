'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HardHat,
  Briefcase,
  DollarSign,
  User,
  FileText,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { mockLabour, getLabourById } from '@/lib/mock-data';

const typeLabels: Record<string, string> = {
  daily: 'Daily Wage',
  monthly: 'Monthly',
  contract: 'Contract',
  piece: 'Piece Rate',
};

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'zinc',
  onLeave: 'orange',
  terminated: 'red',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  onLeave: 'On Leave',
  terminated: 'Terminated',
};

const skillLevelLabels: Record<string, string> = {
  unskilled: 'Unskilled',
  semiskilled: 'Semi-Skilled',
  skilled: 'Skilled',
  highlySkilled: 'Highly Skilled',
};

export default function LabourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const labourId = Number(params.id);
  const labour = getLabourById(labourId) || mockLabour[0];

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {labour.name}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Labour ID: {labour.labourId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/third-party/labour/${labour.id}/edit`}>
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
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Full Name
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Labour ID
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.labourId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>Phone</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.email || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>Address</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardHat className="h-5 w-5" />
                  <span>Work Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Trade/Specialization
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.trade}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Skill Level
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {skillLevelLabels[labour.skillLevel]}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Employment Type
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {typeLabels[labour.type]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={`bg-${statusColors[labour.status]}-100 text-${statusColors[labour.status]}-700 dark:bg-${statusColors[labour.status]}-900 dark:text-${statusColors[labour.status]}-300`}
                      >
                        {statusLabels[labour.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Joining Date</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {format(labour.joiningDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Total Work Days</span>
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.totalWorkDays} days
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Current Project
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.currentProject}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contractor
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.contractorName}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {labour.contractorPhone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Daily Rate
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      ₹{labour.dailyRate}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Overtime Rate
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      ₹{labour.overtimeRate}/hr
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Total Outstanding
                    </label>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      ₹{labour.totalDue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Estimated Monthly
                    </label>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      ₹{((labour.dailyRate || 0) * 26).toLocaleString()}
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
                      {labour.bankAccount}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {labour.bankName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      IFSC Code
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.ifscCode}
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
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Work Days</span>
                    <span className="text-sm font-bold">{labour.totalWorkDays}</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(labour.totalWorkDays / 365) * 100}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Daily Rate</span>
                    <span className="text-sm font-semibold">₹{labour.dailyRate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Overtime Rate</span>
                    <span className="text-sm font-semibold">₹{labour.overtimeRate}/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Outstanding</span>
                    <span className="text-sm font-semibold text-orange-600">
                      ₹{labour.totalDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents & ID */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Documents & ID</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Aadhaar Number
                  </label>
                  <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                    {labour.aadhaarNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    PAN Number
                  </label>
                  <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                    {labour.panNumber}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Name
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.emergencyContactName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Phone
                    </label>
                    <p className="text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {labour.emergencyContact}
                    </p>
                  </div>
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
                  {labour.notes}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
