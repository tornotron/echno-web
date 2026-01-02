'use client';

import { useState, useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { redirect } from 'next/navigation';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { mockUsers } from '@/components/shared/data/users';
import { getRoleDisplayName, getRoleLevel, RoleLevel } from '@/types/rbac/role';
import { Users, UserPlus, Shield, Mail, Phone } from 'lucide-react';

// Helper function to get role level color
function getRoleLevelColor(level: RoleLevel): string {
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
}

export default function AdminUsersPage() {
  const { isSuperAdmin, isLoading } = useAuthorization();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Redirect if not super admin
  if (!isLoading && !isSuperAdmin) {
    redirect('/users/dashboard');
  }

  // Get all unique roles from users
  const allRoles = useMemo(() => {
    const roles = new Set<string>();
    for (const user of mockUsers) {
      if (user.roles) {
        for (const role of user.roles) {
          roles.add(role);
        }
      }
    }
    return [...roles];
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'all' || user.roles?.includes(roleFilter) || false;

      return matchesSearch && matchesRole;
    });
  }, [searchQuery, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Statistics
  const totalUsers = mockUsers.length;
  const totalAdmins = mockUsers.filter((u) =>
    u.roles?.some((r) => r.includes('admin'))
  ).length;
  const totalManagers = mockUsers.filter((u) =>
    u.roles?.some((r) => r.includes('manager'))
  ).length;
  const totalStaff = mockUsers.filter(
    (u) =>
      !u.roles?.some((r) => r.includes('admin')) &&
      !u.roles?.some((r) => r.includes('manager'))
  ).length;

  const hasActiveFilters = Boolean(searchQuery || roleFilter !== 'all');

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and their roles
            </p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Total Users</CardDescription>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-muted-foreground text-xs">Active accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Admins</CardDescription>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalAdmins}
              </div>
              <p className="text-muted-foreground text-xs">
                Super admin & admin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Managers</CardDescription>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalManagers}
              </div>
              <p className="text-muted-foreground text-xs">Management level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Staff</CardDescription>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalStaff}
              </div>
              <p className="text-muted-foreground text-xs">Regular users</p>
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
          searchPlaceholder="Search by name or email..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Role',
              options: [
                { value: 'all', label: 'All Roles' },
                ...allRoles.map((role) => ({
                  value: role,
                  label: getRoleDisplayName(role),
                })),
              ],
              value: roleFilter,
              onChange: (value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}{' '}
            users
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

        {/* Users Table */}
        {filteredUsers.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role(s)</TableHead>
                    <TableHead>Experience</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        (globalThis.location.href = `/admin/access-control/users/${user.id}`)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-zinc-400 to-zinc-600">
                            <span className="text-sm font-medium text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground text-sm">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="text-muted-foreground h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="text-muted-foreground h-3 w-3" />
                            {user.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map((role) => {
                            const level = getRoleLevel(role);
                            return (
                              <Badge
                                key={role}
                                className={getRoleLevelColor(level)}
                              >
                                {role.includes('super-admin') && (
                                  <Shield className="mr-1 h-3 w-3" />
                                )}
                                {getRoleDisplayName(role)}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.experience} years
                          <div className="text-muted-foreground text-xs">
                            {user.qualification?.split(',')[0]}
                          </div>
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
              <Users className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                No users found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first user'}
              </p>
              {!hasActiveFilters && (
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
