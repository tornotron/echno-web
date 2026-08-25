/**
 * app/users/dashboard/workforce/leaves/manage/policies/page.tsx
 *
 * Admin-only leave policy management page.
 * Reuses LeavePoliciesManager component with additional statistics.
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import {
  Settings,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react';
import { LeavePoliciesManager } from '@/features/leave/components/leave-policies-manager';
import { TableSkeleton } from '@/features/leave/components/skeletons';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { useAllLeavePolicies } from '@/hooks/leave/use-leave';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';

export default function LeavePoliciesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: roleLoading } = useLeaveRole();
  const { data: user } = useUser();
  const { data: policies } = useAllLeavePolicies();

  // Calculate statistics
  const totalPolicies = policies?.length || 0;
  const activePolicies = policies?.filter((p) => p.isActive).length || 0;
  const inactivePolicies = totalPolicies - activePolicies;

  // Check admin access
  if (roleLoading) {
    return (
      <div className="container mx-auto p-6">
        <TableSkeleton statCount={3} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to access policy management. This
            feature is restricted to system administrators.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(routes.workforce.leaves.manage.href)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leave Policy Management"
        description="Configure and manage organization leave policies"
        badge={
          <Badge variant="secondary" className="text-sm">
            Admin Only
          </Badge>
        }
      />

      {/* Statistics */}
      <Card className="gap-0 p-6">
        <div className="divide-border grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-1 py-6 sm:py-0 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Policies
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalPolicies}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Settings className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              configured for organisation
            </p>
          </div>
          <div className="flex flex-col gap-1 py-6 sm:px-6 sm:py-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Policies
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {activePolicies}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              currently in use
            </p>
          </div>
          <div className="flex flex-col gap-1 py-6 sm:py-0 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inactive Policies
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-500 dark:text-zinc-400">
                {inactivePolicies}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <XCircle className="size-4 text-zinc-500 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              disabled or archived
            </p>
          </div>
        </div>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Policy Management Guidelines</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Ensure policies comply with labor laws and company regulations
            </li>
            <li>Active policies are immediately available to employees</li>
            <li>
              Changes to active policies affect all employees assigned to them
            </li>
            <li>
              Deactivating a policy does not affect existing leave balances
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Main Policy Manager Component */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Policy Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            Create, Edit, and Manage leave policies for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.defaultOrganizationId ? (
            <LeavePoliciesManager organizationId={user.defaultOrganizationId} />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Organization Not Found</AlertTitle>
              <AlertDescription>
                Unable to load organization information. Please ensure
                you&apos;re logged in and have an active organization.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-5 w-5" />
            Policy Usage Statistics
          </CardTitle>
          <CardDescription className="text-xs">
            Employee enrollment and usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground mb-2">
              Usage analytics coming soon
            </p>
            <p className="text-muted-foreground text-sm">
              Track which policies are most utilized and monitor compliance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
