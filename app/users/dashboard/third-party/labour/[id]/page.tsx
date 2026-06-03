'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
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
  Calendar,
  DollarSign,
  User,
  HardHat,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { format } from 'date-fns';
import Link from 'next/link';
import { routes } from '@/nav';
import { useLabourById, useDeleteLabour } from '@/hooks/labour';
import { EmploymentType, SkillLevel, LabourStatus } from '@/types/labour';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

const typeLabels: Record<EmploymentType, string> = {
  [EmploymentType.DAILY_WAGE]: 'Daily Wage',
  [EmploymentType.MONTHLY]: 'Monthly',
  [EmploymentType.CONTRACT]: 'Contract',
  [EmploymentType.PIECE_RATE]: 'Piece Rate',
};

const statusColors: Record<LabourStatus, string> = {
  [LabourStatus.ACTIVE]: 'green',
  [LabourStatus.INACTIVE]: 'zinc',
  [LabourStatus.ON_LEAVE]: 'orange',
  [LabourStatus.TERMINATED]: 'red',
};

const statusLabels: Record<LabourStatus, string> = {
  [LabourStatus.ACTIVE]: 'Active',
  [LabourStatus.INACTIVE]: 'Inactive',
  [LabourStatus.ON_LEAVE]: 'On Leave',
  [LabourStatus.TERMINATED]: 'Terminated',
};

const skillLevelLabels: Record<SkillLevel, string> = {
  [SkillLevel.UNSKILLED]: 'Unskilled',
  [SkillLevel.SEMI_SKILLED]: 'Semi-Skilled',
  [SkillLevel.SKILLED]: 'Skilled',
  [SkillLevel.HIGHLY_SKILLED]: 'Highly Skilled',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LabourDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const labourId = Number.parseInt(id);
  const { data: labour, isLoading, isError } = useLabourById(labourId);
  const deleteLabour = useDeleteLabour();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !labour) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <HardHat className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Labour record not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.labour.href}>Back to Labour</Link>
        </Button>
      </Empty>
    );
  }

  const handleDelete = () => {
    deleteLabour.mutate(labour.id, {
      onSuccess: () => router.push(routes.thirdParty.labour.href),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={labour.fullName ?? 'Labour Record'}
        description={`Labour ID: ${labour.labourId ?? '—'}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={routes.thirdParty.labour.detail(labour.id).edit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
              disabled={deleteLabour.isPending}
            >
              {deleteLabour.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
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
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Full Name
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.fullName ?? '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Labour ID
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.labourId ?? '—'}
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Phone className="h-3 w-3" />
                    <span>Phone</span>
                  </label>
                  <PhoneDisplay
                    value={labour.phoneNumber}
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
                    {labour.email ?? 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    <span>Address</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.address ?? '—'}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Trade/Specialization
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.specialization ?? '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Skill Level
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.skillLevel
                      ? skillLevelLabels[labour.skillLevel]
                      : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Employment Type
                  </label>
                  <div className="mt-1">
                    {labour.employmentType ? (
                      <Badge variant="outline">
                        {typeLabels[labour.employmentType]}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Status
                  </label>
                  <div className="mt-1">
                    {labour.status ? (
                      <Badge
                        className={`bg-${statusColors[labour.status]}-100 text-${statusColors[labour.status]}-700 dark:bg-${statusColors[labour.status]}-900 dark:text-${statusColors[labour.status]}-300`}
                      >
                        {statusLabels[labour.status]}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>Joining Date</span>
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.joiningDate
                      ? format(new Date(labour.joiningDate), 'MMM dd, yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Current Project
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.currentProjectName ?? '—'}
                  </p>
                </div>
                {labour.contractorName && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Contractor
                    </label>
                    <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                      {labour.contractorName}
                    </p>
                    <PhoneDisplay
                      value={labour.contractorPhone}
                      asLink
                      className="text-zinc-500 dark:text-zinc-500"
                    />
                  </div>
                )}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Daily Rate
                  </label>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {labour.dailyRate ? `₹${labour.dailyRate}` : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Overtime Rate
                  </label>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {labour.overTimeRate ? `₹${labour.overTimeRate}/hr` : '—'}
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
                    ₹{((labour.dailyRate ?? 0) * 26).toLocaleString()}
                  </p>
                </div>
              </div>
              {(labour.bankName || labour.bankAccountNumber) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {labour.bankName && (
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          Bank
                        </label>
                        <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                          {labour.bankName}
                        </p>
                      </div>
                    )}
                    {labour.bankAccountNumber && (
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          Account Number
                        </label>
                        <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                          {labour.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    {labour.ifscCode && (
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          IFSC Code
                        </label>
                        <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                          {labour.ifscCode}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {labour.additionalNotes && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Additional Notes
                    </label>
                    <p className="mt-1 text-base whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                      {labour.additionalNotes}
                    </p>
                  </div>
                </>
              )}
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
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Daily Rate
                  </span>
                  <span className="text-sm font-semibold">
                    {labour.dailyRate ? `₹${labour.dailyRate}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Overtime Rate
                  </span>
                  <span className="text-sm font-semibold">
                    {labour.overTimeRate ? `₹${labour.overTimeRate}/hr` : '—'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Name
                  </label>
                  <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                    {labour.emergencyContactName ?? 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Phone
                  </label>
                  <div className="mt-1">
                    <PhoneDisplay
                      value={labour.emergencyContactNumber}
                      asLink
                      numberClassName="text-base text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
