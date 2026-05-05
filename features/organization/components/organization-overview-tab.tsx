import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';
import { Mail, Phone, Globe, Users, Briefcase } from 'lucide-react';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import Link from 'next/link';
import type { Organization } from '@/types/organization/organization';

interface OrganizationOverviewTabProps {
  organization: Organization;
  orgEmployeesCount: number;
  orgProjectsCount: number;
}

export function OrganizationOverviewTab({
  organization,
  orgEmployeesCount,
  orgProjectsCount,
}: OrganizationOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Contact Information */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Organization contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Email
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {organization.organizationEmail}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Phone
                </p>
                <PhoneDisplay
                  value={organization.organizationPhone}
                  asLink
                  numberClassName="font-medium text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            {organization.organizationWebsite && (
              <>
                <Separator />
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Website
                    </p>
                    <a
                      href={organization.organizationWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {organization.organizationWebsite}
                    </a>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Quick overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization.id == null ? (
              <div className="flex items-center justify-between rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Employees
                  </span>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {orgEmployeesCount}
                </span>
              </div>
            ) : (
              <Link
                href={`/users/dashboard/workforce/employees?organizationId=${organization.id}`}
                className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Employees
                  </span>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {orgEmployeesCount}
                </span>
              </Link>
            )}
            <Separator />
            {organization.id == null ? (
              <div className="flex items-center justify-between rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Projects
                  </span>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {orgProjectsCount}
                </span>
              </div>
            ) : (
              <Link
                href={`/users/dashboard/projects?organizationId=${organization.id}`}
                className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Projects
                  </span>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {orgProjectsCount}
                </span>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
