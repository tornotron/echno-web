'use client';

import { notFound } from 'next/navigation';
import { useState, use } from 'react';
import { mockOrganizations, mockEmployees, mockProjects } from '@/lib/mock-data';
import { AppLayout } from '@/components/common/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDepartmentLabel } from '@/types/employee';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Edit,
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Settings,
  Network,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface OrganizationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'hierarchy'>('overview');

  const organization = mockOrganizations.find((org) => org.id === parseInt(resolvedParams.id));

  if (!organization) {
    notFound();
  }

  // Get employees and projects for this organization
  const orgEmployees = mockEmployees.filter((emp) =>
    emp.organizations?.some((org) => org.id === organization.id)
  );
  const orgProjects = mockProjects.filter((proj) => proj.id === organization.id);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            {organization.organizationLogo ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                <Image
                  src={organization.organizationLogo}
                  alt={organization.organizationName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Building className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {organization.organizationName}
                </h1>
                <Badge variant={organization.isActive ? 'default' : 'secondary'}>
                  {organization.isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4" />
                  <span>{organization.organizationAddress}</span>
                </div>
                {organization.createdAt && (
                  <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>Created on {format(organization.createdAt, 'MMMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Link href={`/dashboard/organizations/${organization.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Organization
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Organization contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {organization.organizationEmail}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Phone</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {organization.organizationPhone}
                    </p>
                  </div>
                </div>
                {organization.organizationWebsite && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Website</p>
                        <a
                          href={organization.organizationWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Employees</span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {orgEmployees.length}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Projects</span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {orgProjects.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Manage organization preferences and configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                  General Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Organization Status
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Enable or disable this organization
                      </p>
                    </div>
                    <Badge variant={organization.isActive ? 'default' : 'secondary'}>
                      {organization.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Total Employees
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Number of employees in this organization
                      </p>
                    </div>
                    <Badge variant="outline">{orgEmployees.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Total Projects
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Number of projects in this organization
                      </p>
                    </div>
                    <Badge variant="outline">{orgProjects.length}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                  Permissions & Access
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Employee Management
                    </span>
                    <span className="text-xs text-zinc-500">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Project Management
                    </span>
                    <span className="text-xs text-zinc-500">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Issue Tracking
                    </span>
                    <span className="text-xs text-zinc-500">Enabled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'hierarchy' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Organization Hierarchy</CardTitle>
              <CardDescription>View the organizational structure and reporting relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                    Departments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from(new Set(orgEmployees.map(emp => emp.department))).map((dept) => {
                      const deptEmployees = orgEmployees.filter(emp => emp.department === dept);
                      return (
                        <div
                          key={dept}
                          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                                {getDepartmentLabel(dept)}
                              </h4>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                {deptEmployees.length} {deptEmployees.length === 1 ? 'employee' : 'employees'}
                              </p>
                            </div>
                            <Badge variant="outline">{deptEmployees.length}</Badge>
                          </div>
                          <div className="space-y-2">
                            {deptEmployees.slice(0, 3).map((emp) => (
                              <div key={emp.id} className="flex items-center space-x-2 text-sm">
                                <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <User className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-zinc-700 dark:text-zinc-300">{emp.name}</span>
                              </div>
                            ))}
                            {deptEmployees.length > 3 && (
                              <p className="text-xs text-zinc-500 ml-8">
                                +{deptEmployees.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {orgEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <Network className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">No hierarchy data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
