/**
 * app/users/dashboard/workforce/leaves/policies/page.tsx
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
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react';
import { LeavePoliciesManager } from '@/features/leave/components/leave-policies-manager';
import { TableSkeleton } from '@/features/leave/components/skeletons';
import { StatCard } from '@/features/leave/components/stat-card';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { useAllLeavePolicies } from '@/hooks/leave/use-leave';
import { useUser } from '@/hooks/user/use-user';

export default function LeavePoliciesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: roleLoading } = useLeaveRole();
  const { data: user } = useUser();
  const { data: policies, isLoading: policiesLoading } = useAllLeavePolicies();

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
          onClick={() => router.push('/users/dashboard/workforce/leaves')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Shield className="h-8 w-8" />
            Leave Policy Management
          </h1>
          <p className="text-muted-foreground">
            Configure and manage organization leave policies
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Admin Only
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Settings}
          label="Total Policies"
          value={totalPolicies}
          color="blue"
          description="configured for organization"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Policies"
          value={activePolicies}
          color="green"
          description="currently in use"
        />
        <StatCard
          icon={XCircle}
          label="Inactive Policies"
          value={inactivePolicies}
          color="gray"
          description="disabled or archived"
        />
      </div>

      {/* Policy Compliance Overview */}
      {policies && policies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Policy Compliance</CardTitle>
            <CardDescription>
              Overview of policy configurations and compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policies.slice(0, 5).map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{policy.leaveTypeName}</p>
                    <p className="text-muted-foreground text-sm">
                      {policy.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      <Calendar className="mr-1 h-3 w-3" />
                      {policy.annualQuota || 0} days
                    </Badge>
                    {policy.carryForwardLimit &&
                      policy.carryForwardLimit > 0 && (
                        <Badge variant="outline" className="text-xs">
                          CF: {policy.carryForwardLimit}d
                        </Badge>
                      )}
                  </div>
                </div>
              ))}

              {policies.length > 5 && (
                <p className="text-muted-foreground pt-2 text-center text-sm">
                  + {policies.length - 5} more policies
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
          <CardTitle>Policy Configuration</CardTitle>
          <CardDescription>
            Create, edit, and manage leave policies for your organization
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Policy Usage Statistics
          </CardTitle>
          <CardDescription>
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
