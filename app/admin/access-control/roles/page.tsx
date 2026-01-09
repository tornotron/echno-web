'use client';

import { useState, useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { redirect } from 'next/navigation';
import { SearchAndFilter, Pagination } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  getAllSystemRoles,
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
} from '@/types/rbac/role';
import { Shield, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Helper function to get role level colors
const getRoleLevelColor = (level: RoleLevel): string => {
  const colors: Record<RoleLevel, string> = {
    [RoleLevel.ADMIN]:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [RoleLevel.MANAGEMENT]:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [RoleLevel.PROFESSIONAL]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [RoleLevel.SUPERVISORY]:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    [RoleLevel.SKILLED]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [RoleLevel.GENERAL]:
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    [RoleLevel.EXTERNAL]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [RoleLevel.TRAINEE]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return colors[level] || colors[RoleLevel.GENERAL];
};

export default function RolesPage() {
  const { isSystemAdmin, isLoading } = useAuthorization();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  const systemRoles = getAllSystemRoles();

  const filteredRoles = useMemo(() => {
    return systemRoles.filter((role) => {
      const matchesSearch = getRoleDisplayName(role)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesLevel =
        levelFilter === 'all' || getRoleLevel(role) === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [systemRoles, searchQuery, levelFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(searchQuery || levelFilter !== 'all');

  const clearFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Browser</h1>
          <p className="text-muted-foreground mt-1">
            Explore all system roles available in the application
          </p>
        </div>
      </div>

      {/* Keycloak Notice */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertTitle>Permissions Managed in Keycloak</AlertTitle>
        <AlertDescription>
          Role permissions are now managed through Keycloak Authorization
          Services. To view or modify permissions, access the Keycloak Admin
          Console.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Roles</CardDescription>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles.length}</div>
            <p className="text-muted-foreground text-xs">
              System-defined roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Role Categories</CardDescription>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-muted-foreground text-xs">
              Admin, Management, Professional, etc.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search roles..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Filter by level',
            options: [
              { value: 'all', label: 'All Levels' },
              ...Object.values(RoleLevel).map((level) => ({
                value: level,
                label: level.charAt(0).toUpperCase() + level.slice(1),
              })),
            ],
            value: levelFilter,
            onChange: setLevelFilter,
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredRoles.length)}{' '}
          of {filteredRoles.length} roles
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((roleId) => {
                const level = getRoleLevel(roleId);
                const isAdmin = roleId === 'system-admin';

                return (
                  <TableRow
                    key={roleId}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      (globalThis.location.href = `/admin/access-control/roles/${roleId}`)
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">
                          {getRoleDisplayName(roleId)}
                        </span>
                        {isAdmin && (
                          <Badge className="bg-red-600 text-white">
                            Full Access
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleLevelColor(level)}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {isAdmin
                          ? 'Unrestricted system access'
                          : `${level.charAt(0).toUpperCase() + level.slice(1)}-level access`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </div>
  );
}
