'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { logger } from '@/lib/logger';
import { redirect, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  Blocks,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  Module,
  EntitlementStatus,
  UserModuleEntitlement,
} from '@/types/rbac/module';
import { mockModuleEntitlements } from '@/components/shared/data/module-entitlements';
import { mockOrganizations } from '@/components/shared/data/organizations';
import { AppLayout } from '@/components/common/app-layout';

// Helper function to get module display name
function getModuleDisplayName(module: Module): string {
  return module
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get status color
function getStatusColor(status: EntitlementStatus): string {
  const colors: Record<EntitlementStatus, string> = {
    [EntitlementStatus.ACTIVE]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [EntitlementStatus.TRIAL]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [EntitlementStatus.SUSPENDED]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [EntitlementStatus.EXPIRED]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    [EntitlementStatus.PENDING]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return colors[status];
}

// Helper function to get status icon
function getStatusIcon(status: EntitlementStatus) {
  switch (status) {
    case EntitlementStatus.ACTIVE: {
      return <CheckCircle className="h-4 w-4" />;
    }
    case EntitlementStatus.TRIAL: {
      return <Clock className="h-4 w-4" />;
    }
    case EntitlementStatus.SUSPENDED: {
      return <AlertCircle className="h-4 w-4" />;
    }
    case EntitlementStatus.EXPIRED: {
      return <XCircle className="h-4 w-4" />;
    }
    case EntitlementStatus.PENDING: {
      return <Clock className="h-4 w-4" />;
    }
    default: {
      return null;
    }
  }
}

interface ModuleStats {
  totalOrganizations: number;
  activeEntitlements: number;
  trialEntitlements: number;
  suspendedEntitlements: number;
  expiredEntitlements: number;
  totalSeats: number;
  paidLicenses: number;
  freeLicenses: number;
}

export default function ModuleDetailsPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { isSystemAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [moduleId, setModuleId] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<UserModuleEntitlement[]>([]);
  const [stats, setStats] = useState<ModuleStats>({
    totalOrganizations: 0,
    activeEntitlements: 0,
    trialEntitlements: 0,
    suspendedEntitlements: 0,
    expiredEntitlements: 0,
    totalSeats: 0,
    paidLicenses: 0,
    freeLicenses: 0,
  });
  const [loading, setLoading] = useState(true);

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setModuleId(p.moduleId));
  }, [params]);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  const fetchModuleData = useCallback(async () => {
    if (!moduleId) return;

    try {
      setLoading(true);

      // Get entitlements for this module
      const moduleEntitlements = mockModuleEntitlements.filter(
        (ent) => ent.module === moduleId
      );

      if (moduleEntitlements.length === 0) {
        toast.error('Module not found');
        setEntitlements([]);
        return;
      }

      setEntitlements(moduleEntitlements);

      // Calculate stats
      const moduleStats: ModuleStats = {
        totalOrganizations: moduleEntitlements.length,
        activeEntitlements: moduleEntitlements.filter(
          (e) => e.status === EntitlementStatus.ACTIVE
        ).length,
        trialEntitlements: moduleEntitlements.filter(
          (e) => e.status === EntitlementStatus.TRIAL
        ).length,
        suspendedEntitlements: moduleEntitlements.filter(
          (e) => e.status === EntitlementStatus.SUSPENDED
        ).length,
        expiredEntitlements: moduleEntitlements.filter(
          (e) => e.status === EntitlementStatus.EXPIRED
        ).length,
        totalSeats: moduleEntitlements.reduce(
          (sum, e) => sum + (e.license?.seats || 0),
          0
        ),
        paidLicenses: moduleEntitlements.filter(
          (e) => e.license?.type === 'paid'
        ).length,
        freeLicenses: moduleEntitlements.filter(
          (e) => e.license?.type === 'free'
        ).length,
      };

      setStats(moduleStats);
    } catch (error) {
      toast.error('Failed to load module data');
      logger.error(`${error}`);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModuleData();
  }, [fetchModuleData]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading module details...</p>
        </div>
      </div>
    );
  }

  if (entitlements.length === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">Module Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The module you&apos;re looking for doesn&apos;t exist or has no
                entitlements.
              </p>
              <Button
                onClick={() => router.push('/admin/access-control/modules')}
              >
                Back to Modules
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const moduleName = getModuleDisplayName(moduleId as Module);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Blocks className="text-primary h-8 w-8" />
              {moduleName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Module access and entitlement management
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {moduleId}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Total Organizations</CardDescription>
              <Building2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOrganizations}
              </div>
              <p className="text-muted-foreground text-xs">
                With access to this module
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Active Entitlements</CardDescription>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeEntitlements}
              </div>
              <p className="text-muted-foreground text-xs">Currently in use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Trial Licenses</CardDescription>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.trialEntitlements}
              </div>
              <p className="text-muted-foreground text-xs">
                Organizations on trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Total Seats</CardDescription>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSeats}</div>
              <p className="text-muted-foreground text-xs">
                Across all licenses
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations">
              Organizations ({entitlements.length})
            </TabsTrigger>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organizations with Access</CardTitle>
                <CardDescription>
                  All organizations that have entitlements for this module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entitlements.map((entitlement) => {
                      const org = mockOrganizations.find(
                        (o) => o.id?.toString() === entitlement.organizationId
                      );
                      const isExpiringSoon =
                        entitlement.expiresAt &&
                        entitlement.expiresAt > new Date() &&
                        entitlement.expiresAt <=
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <TableRow
                          key={entitlement.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            (globalThis.location.href = `/admin/access-control/modules/${moduleId}/organizations/${entitlement.organizationId}`)
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="text-muted-foreground h-4 w-4" />
                              <div>
                                <div className="font-medium">
                                  {org?.organizationName || 'Unknown Org'}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  ID: {entitlement.organizationId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(entitlement.status)}
                            >
                              <span className="mr-1">
                                {getStatusIcon(entitlement.status)}
                              </span>
                              {entitlement.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {entitlement.license?.type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {entitlement.license?.seats ? (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {entitlement.license.seats}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                entitlement.grantedAt
                              ).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {entitlement.expiresAt ? (
                              <span
                                className={`flex items-center gap-1 text-sm ${
                                  isExpiringSoon ? 'text-orange-600' : ''
                                }`}
                              >
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  entitlement.expiresAt
                                ).toLocaleDateString()}
                                {isExpiringSoon && (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No expiry
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Paid Licenses</CardDescription>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.paidLicenses}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Active subscriptions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Free Licenses</CardDescription>
                  <Shield className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.freeLicenses}</div>
                  <p className="text-muted-foreground text-xs">
                    Free tier usage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Trial Licenses</CardDescription>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.trialEntitlements}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Evaluation period
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>License Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of all licenses for this module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entitlements
                    .filter((e) => e.license)
                    .map((entitlement) => {
                      const org = mockOrganizations.find(
                        (o) => o.id?.toString() === entitlement.organizationId
                      );
                      return (
                        <div
                          key={entitlement.id}
                          className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Building2 className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">
                                {org?.organizationName || 'Unknown'}
                              </span>
                              <Badge variant="outline">
                                {entitlement.license?.type}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm">
                              {entitlement.license?.seats && (
                                <span className="text-muted-foreground">
                                  Seats: {entitlement.license.seats}
                                </span>
                              )}
                              {entitlement.license?.features && (
                                <span className="text-muted-foreground">
                                  Features:{' '}
                                  {entitlement.license.features.length}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(entitlement.status)}>
                            {entitlement.status}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of entitlement statuses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {stats.activeEntitlements}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        (
                        {Math.round(
                          (stats.activeEntitlements /
                            stats.totalOrganizations) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Trial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {stats.trialEntitlements}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        (
                        {Math.round(
                          (stats.trialEntitlements / stats.totalOrganizations) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span>Suspended</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {stats.suspendedEntitlements}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        (
                        {Math.round(
                          (stats.suspendedEntitlements /
                            stats.totalOrganizations) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-gray-600" />
                      <span>Expired</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {stats.expiredEntitlements}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        (
                        {Math.round(
                          (stats.expiredEntitlements /
                            stats.totalOrganizations) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>License Summary</CardTitle>
                  <CardDescription>Revenue and usage metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Seats</span>
                    <span className="text-xl font-bold">
                      {stats.totalSeats}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid Licenses</span>
                    <span className="font-medium text-green-600">
                      {stats.paidLicenses}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Free Licenses</span>
                    <span className="font-medium">{stats.freeLicenses}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Conversion Rate
                    </span>
                    <span className="font-medium">
                      {stats.trialEntitlements > 0
                        ? Math.round(
                            (stats.paidLicenses /
                              (stats.paidLicenses + stats.trialEntitlements)) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
