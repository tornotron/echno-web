'use client';

import { useState, useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { redirect } from 'next/navigation';
import { Pagination, SearchAndFilter } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockModuleEntitlements } from '@/components/shared/data/module-entitlements';
import { Module, EntitlementStatus } from '@/types/rbac/module';
import {
  Blocks,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Building2,
  Shield,
  PlusCircle,
} from 'lucide-react';

// Helper function to get module display name
function getModuleDisplayName(module: Module): string {
  return module
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ModulesPage() {
  const { isSystemAdmin, isLoading } = useAuthorization();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  // Get unique modules with aggregated data
  const moduleData = useMemo(() => {
    const moduleMap = new Map<
      Module,
      {
        module: Module;
        totalOrgs: number;
        activeCount: number;
        trialCount: number;
        suspendedCount: number;
        expiredCount: number;
        paidLicenses: number;
        freeLicenses: number;
        trialLicenses: number;
      }
    >();

    for (const ent of mockModuleEntitlements) {
      if (!moduleMap.has(ent.module)) {
        moduleMap.set(ent.module, {
          module: ent.module,
          totalOrgs: 0,
          activeCount: 0,
          trialCount: 0,
          suspendedCount: 0,
          expiredCount: 0,
          paidLicenses: 0,
          freeLicenses: 0,
          trialLicenses: 0,
        });
      }

      const data = moduleMap.get(ent.module)!;
      data.totalOrgs++;

      // Count by status
      switch (ent.status) {
        case EntitlementStatus.ACTIVE: {
          data.activeCount++;
          break;
        }
        case EntitlementStatus.TRIAL: {
          data.trialCount++;
          break;
        }
        case EntitlementStatus.SUSPENDED: {
          data.suspendedCount++;
          break;
        }
        case EntitlementStatus.EXPIRED: {
          data.expiredCount++;
          break;
        }
      }

      // Count by license type
      switch (ent.license?.type) {
        case 'paid':
        case 'enterprise': {
          data.paidLicenses++;
          break;
        }
        case 'free': {
          data.freeLicenses++;
          break;
        }
        case 'trial': {
          data.trialLicenses++;
          break;
        }
      }
    }

    return [...moduleMap.values()];
  }, []);

  // Filter modules
  const filteredModules = useMemo(() => {
    return moduleData.filter((mod) => {
      const matchesSearch = mod.module
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && mod.activeCount > 0) ||
        (statusFilter === 'trial' && mod.trialCount > 0) ||
        (statusFilter === 'suspended' && mod.suspendedCount > 0) ||
        (statusFilter === 'expired' && mod.expiredCount > 0);

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, moduleData]);

  // Pagination
  const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModules = filteredModules.slice(startIndex, endIndex);

  // Statistics
  const totalModules = moduleData.length;
  const totalActiveEntitlements = moduleData.reduce(
    (sum, mod) => sum + mod.activeCount,
    0
  );
  const totalTrialEntitlements = moduleData.reduce(
    (sum, mod) => sum + mod.trialCount,
    0
  );
  const totalSuspendedEntitlements = moduleData.reduce(
    (sum, mod) => sum + mod.suspendedCount,
    0
  );

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'all');

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getStatusBadge = (
    activeCount: number,
    trialCount: number,
    suspendedCount: number,
    expiredCount: number
  ) => {
    if (activeCount > 0) {
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3" />
          Active ({activeCount})
        </Badge>
      );
    }
    if (trialCount > 0) {
      return (
        <Badge className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3" />
          Trial ({trialCount})
        </Badge>
      );
    }
    if (suspendedCount > 0) {
      return (
        <Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="h-3 w-3" />
          Suspended ({suspendedCount})
        </Badge>
      );
    }
    if (expiredCount > 0) {
      return (
        <Badge className="gap-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          <AlertCircle className="h-3 w-3" />
          Expired ({expiredCount})
        </Badge>
      );
    }
    return null;
  };

  const getLicenseTypeBadges = (
    paidCount: number,
    freeCount: number,
    trialCount: number
  ) => {
    const badges = [];
    if (paidCount > 0) {
      badges.push(
        <Badge
          key="paid"
          variant="outline"
          className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
        >
          <Shield className="h-3 w-3" />
          Paid ({paidCount})
        </Badge>
      );
    }
    if (freeCount > 0) {
      badges.push(
        <Badge
          key="free"
          variant="outline"
          className="gap-1 border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
        >
          Free ({freeCount})
        </Badge>
      );
    }
    if (trialCount > 0) {
      badges.push(
        <Badge
          key="trial"
          variant="outline"
          className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
        >
          <Clock className="h-3 w-3" />
          Trial ({trialCount})
        </Badge>
      );
    }
    return badges;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage module entitlements and licenses
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Module
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Modules</CardDescription>
            <Blocks className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-muted-foreground text-xs">Available modules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Active</CardDescription>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalActiveEntitlements}
            </div>
            <p className="text-muted-foreground text-xs">Active entitlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Trial</CardDescription>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totalTrialEntitlements}
            </div>
            <p className="text-muted-foreground text-xs">Trial entitlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Suspended</CardDescription>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalSuspendedEntitlements}
            </div>
            <p className="text-muted-foreground text-xs">
              Suspended entitlements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search modules..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'Trial' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'expired', label: 'Expired' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredModules.length)} of{' '}
          {filteredModules.length} modules
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modules Table */}
      {filteredModules.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>License Types</TableHead>
                  <TableHead>Organizations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedModules.map((mod) => (
                  <TableRow
                    key={mod.module}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      (globalThis.location.href = `/admin/access-control/modules/${mod.module}`)
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600">
                          <Blocks className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {getModuleDisplayName(mod.module)}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {mod.module}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadge(
                          mod.activeCount,
                          mod.trialCount,
                          mod.suspendedCount,
                          mod.expiredCount
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getLicenseTypeBadges(
                          mod.paidLicenses,
                          mod.freeLicenses,
                          mod.trialLicenses
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">{mod.totalOrgs}</span>
                        <span className="text-muted-foreground text-sm">
                          organizations
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Blocks className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No modules found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first module'}
            </p>
            {!hasActiveFilters && (
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
