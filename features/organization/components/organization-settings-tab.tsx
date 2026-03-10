import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Star } from 'lucide-react';
import Link from 'next/link';
import type { Organization } from '@/types/organization/organization';

interface OrganizationSettingsTabProps {
  organization: Organization;
  isDefault: boolean;
  orgEmployeesCount: number;
  orgProjectsCount: number;
  onSetAsDefault: () => void;
}

export function OrganizationSettingsTab({
  organization,
  isDefault,
  orgEmployeesCount,
  orgProjectsCount,
  onSetAsDefault,
}: OrganizationSettingsTabProps) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Manage organization preferences and configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              General Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Default Organization
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {isDefault
                      ? 'This is your default organization for viewing data'
                      : 'Set as default to filter all data by this organization'}
                  </p>
                </div>
                {isDefault ? (
                  <Badge
                    variant="outline"
                    className="border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                  >
                    <Star className="mr-1 h-3 w-3 fill-yellow-500" />
                    Default
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={onSetAsDefault}>
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Organization Status
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Enable or disable this organization
                  </p>
                </div>
                <Badge
                  variant={organization.isActive ? 'default' : 'secondary'}
                >
                  {organization.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Total Employees
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Number of employees in this organization
                  </p>
                </div>
                <Badge variant="outline">{orgEmployeesCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Total Projects
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Number of projects in this organization
                  </p>
                </div>
                <Badge variant="outline">{orgProjectsCount}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Permissions & Access
            </h3>
            {/* TODO: Wire to real permission data from organization.permissions or API */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Employee Management
                </span>
                <span className="text-xs text-zinc-500">Enabled</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Project Management
                </span>
                <span className="text-xs text-zinc-500">Enabled</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Issue Tracking
                </span>
                <span className="text-xs text-zinc-500">Enabled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leave Policies</CardTitle>
            <CardDescription>
              Manage leave policies for this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Configure leave types, accrual rules, and policy settings for
              employees.
            </p>
            <Link href="/users/dashboard/workforce/leaves/policies">
              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Go to Leave Policy Management
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Settings</CardTitle>
            <CardDescription>
              Configure attendance rules and shift templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Set up check-in/check-out cycles, photo and geolocation
              requirements, movement tracking, and regularization rules.
            </p>
            <Link href="/users/dashboard/attendance/settings">
              <Button>
                <User className="mr-2 h-4 w-4" />
                Go to Attendance Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
