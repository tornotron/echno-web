'use client';
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
  Clock,
  DollarSign,
  User,
  HardHat,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { mockLabour, getLabourById } from '@/components/shared/mock-data';

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

interface PageProps {
  params: { id: string };
}

export default function LabourDetailPage({ params }: PageProps) {
  const { id } = params;
  const labourId = Number.parseInt(id);
  const labour = getLabourById(labourId) || mockLabour[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {labour.name}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Labour ID: {labour.labourId}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/users/dashboard/third-party/labour/${labour.id}/edit`}
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
                <User className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Full Name
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Labour ID
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.labourId}
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Phone className="h-3 w-3" />
                    <span>Phone</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.phone}
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Mail className="h-3 w-3" />
                    <span>Email</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.email || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    <span>Address</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Trade/Specialization
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.trade}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Skill Level
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {skillLevelLabels[labour.skillLevel]}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Employment Type
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline">{typeLabels[labour.type]}</Badge>
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
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>Joining Date</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {format(labour.joiningDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Clock className="h-3 w-3" />
                    <span>Total Work Days</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.totalWorkDays} days
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Current Project
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.currentProject}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contractor
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Daily Rate
                  </label>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{labour.dailyRate}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Overtime Rate
                  </label>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{labour.overtimeRate}/hr
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Total Outstanding
                  </label>
                  <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
                    ₹{(labour.totalDue ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Estimated Monthly
                  </label>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{((labour.dailyRate || 0) * 26).toLocaleString()}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Supervisor
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.supervisorName || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Current Site
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.currentSite || 'Not assigned'}
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
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Work Days
                  </span>
                  <span className="text-sm font-bold">
                    {labour.totalWorkDays ?? 0}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${((labour.totalWorkDays ?? 0) / 365) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Daily Rate
                  </span>
                  <span className="text-sm font-semibold">
                    ₹{labour.dailyRate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Overtime Rate
                  </span>
                  <span className="text-sm font-semibold">
                    ₹{labour.overtimeRate}/hr
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Outstanding
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    ₹{(labour.totalDue ?? 0).toLocaleString()}
                  </span>
                </div>
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
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.emergencyContactName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Phone
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.emergencyContactPhone || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
