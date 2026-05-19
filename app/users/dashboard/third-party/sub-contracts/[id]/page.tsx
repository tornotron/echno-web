'use client';

import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';
import { Badge } from '@/components/shadcn/badge';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import {
  Edit,
  Loader2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { routes } from '@/nav';
import { useSubContract } from '@/hooks/sub-contracts';
import {
  getContractTypeLabel,
  getContractStatusLabel,
  getContractStatusColor,
} from '@/types/third-party/sub-contract';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

const milestoneStatusIcons: Record<string, LucideIcon> = {
  completed: CheckCircle2,
  inProgress: Clock,
  pending: AlertCircle,
  delayed: AlertCircle,
};

const milestoneStatusColors: Record<string, string> = {
  completed: 'text-green-600',
  inProgress: 'text-blue-600',
  pending: 'text-orange-600',
  delayed: 'text-red-600',
};

export default function SubContractDetailPage() {
  const params = useParams();
  const contractId = Number(params.id);
  const { data: subContract, isLoading, isError } = useSubContract(contractId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !subContract) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <FileText className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Sub-contract not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.subContracts.href}>
            Back to Sub-Contracts
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={subContract.contractorName}
        description={`Contract ID: ${subContract.contractId}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={
                  routes.thirdParty.subContracts.detail(subContract.id).edit
                }
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
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Contractor Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contractor Name
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {subContract.contractorName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contract ID
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {subContract.contractId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contact Person
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {subContract.contactPerson}
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Phone className="h-3 w-3" />
                    <span>Phone</span>
                  </label>
                  <PhoneDisplay
                    value={subContract.phone}
                    asLink
                    numberClassName="text-base text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Mail className="h-3 w-3" />
                    <span>Email</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {subContract.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contract Type
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {getContractTypeLabel(subContract.type)}
                    </Badge>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    <span>Address</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={`bg-${getContractStatusColor(subContract.status)}-100 text-${getContractStatusColor(subContract.status)}-700 dark:bg-${getContractStatusColor(subContract.status)}-900 dark:text-${getContractStatusColor(subContract.status)}-300`}
                    >
                      {getContractStatusLabel(subContract.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Payment Terms
                  </label>
                  <p className="mt-1 text-base text-zinc-900 capitalize dark:text-zinc-100">
                    {subContract.paymentTerms}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Start Date
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {format(subContract.startDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    End Date
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {format(subContract.endDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Duration
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {subContract.duration} days
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Completion
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${subContract.completionPercentage}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {subContract.completionPercentage}%
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Scope of Work
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contract Value
                  </label>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{(subContract.contractValue / 100_000).toFixed(2)}L
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Paid Amount
                  </label>
                  <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                    ₹{(subContract.totalPaid / 100_000).toFixed(2)}L
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Pending Amount
                  </label>
                  <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
                    ₹{(subContract.totalDue / 100_000).toFixed(2)}L
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Bank Account
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {subContract.accountNumber}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">
                    {subContract.bankName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    IFSC Code
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
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
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Progress
                  </span>
                  <span className="text-sm font-bold">
                    {subContract.completionPercentage}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${subContract.completionPercentage}%` }}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Contract Value
                  </span>
                  <span className="text-sm font-semibold">
                    ₹{(subContract.contractValue / 100_000).toFixed(2)}L
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Paid
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    ₹{(subContract.totalPaid / 100_000).toFixed(2)}L
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Pending
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    ₹{(subContract.totalDue / 100_000).toFixed(2)}L
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Duration
                  </span>
                  <span className="text-sm font-semibold">
                    {subContract.duration} days
                  </span>
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
                {(subContract.milestones ?? []).map((milestone, idx) => {
                  const StatusIcon =
                    milestoneStatusIcons[milestone.status] ?? AlertCircle;
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div className="mb-2 flex items-center space-x-2">
                        <StatusIcon
                          className={`h-4 w-4 ${milestoneStatusColors[milestone.status] ?? 'text-zinc-500'}`}
                        />
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {milestone.name}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Due: {format(milestone.targetDate, 'MMM dd, yyyy')}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {milestone.paymentPercentage}% • ₹
                          {(milestone.amount / 100_000).toFixed(2)}L
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
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {subContract.gstNumber}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  PAN Number
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
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
  );
}
