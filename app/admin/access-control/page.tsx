'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { redirect, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllSystemRoles,
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
} from '@/types/rbac/role';
import {
  Shield,
  Users,
  Search,
  Filter,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';

// Helper function for role level colors
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
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    [RoleLevel.EXTERNAL]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [RoleLevel.TRAINEE]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return colors[level] || colors[RoleLevel.GENERAL];
};

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt?: string;
  lastLogin?: string;
}

interface AccessControlStats {
  totalUsers: number;
  totalRoles: number;
  superAdmins: number;
  noRoleUsers: number;
}

export default function AccessControlDashboard() {
  const { isSuperAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccessControlStats>({
    totalUsers: 0,
    totalRoles: 0,
    superAdmins: 0,
    noRoleUsers: 0,
  });

  // Redirect if not super admin
  if (!isLoading && !isSuperAdmin) {
    redirect('/users/dashboard');
  }

  const systemRoles = getAllSystemRoles();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users?limit=100');
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      const userList = data.users || data || [];
      setUsers(userList);

      // Calculate stats
      const stats: AccessControlStats = {
        totalUsers: userList.length,
        totalRoles: systemRoles.length,
        superAdmins: userList.filter((u: User) =>
          u.roles?.includes('super_admin')
        ).length,
        noRoleUsers: userList.filter(
          (u: User) => !u.roles || u.roles.length === 0
        ).length,
      };
      setStats(stats);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [systemRoles.length]);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'no-roles') {
        filtered = filtered.filter(
          (user) => !user.roles || user.roles.length === 0
        );
      } else if (roleFilter === 'super-admin') {
        filtered = filtered.filter((user) =>
          user.roles?.includes('super_admin')
        );
      } else {
        filtered = filtered.filter((user) => user.roles?.includes(roleFilter));
      }
    }

    setFilteredUsers(filtered);
  }, [search, roleFilter, users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading access control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Shield className="text-primary h-8 w-8" />
            Access Control Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions across the system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center text-sm">
              <Users className="mr-1 h-4 w-4" />
              Active accounts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Available Roles</CardDescription>
            <CardTitle className="text-3xl">{stats.totalRoles}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center text-sm">
              <Shield className="mr-1 h-4 w-4" />
              System roles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Super Admins</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats.superAdmins}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center text-sm">
              <UserCog className="mr-1 h-4 w-4" />
              Full system access
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>No Roles Assigned</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {stats.noRoleUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center text-sm">
              <Filter className="mr-1 h-4 w-4" />
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="no-roles">No Roles Assigned</SelectItem>
                <SelectItem value="super-admin">Super Admins</SelectItem>
                <SelectItem value="divider" disabled>
                  ──────────
                </SelectItem>
                {systemRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchUsers}>
              Refresh
            </Button>
          </div>

          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">
                No users found matching your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() =>
                router.push(`/admin/access-control/users/${user.id}`)
              }
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      {user.roles?.includes('super_admin') && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <Shield className="mr-1 h-3 w-3" />
                          Super Admin
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-3 text-sm">
                      {user.email}
                    </p>

                    {/* Roles */}
                    <div className="flex flex-wrap gap-2">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.slice(0, 5).map((role) => {
                          const level = getRoleLevel(role);
                          return (
                            <Badge
                              key={role}
                              variant="secondary"
                              className={getRoleLevelColor(level)}
                            >
                              {getRoleDisplayName(role)}
                            </Badge>
                          );
                        })
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-orange-300 text-orange-600"
                        >
                          No roles assigned
                        </Badge>
                      )}
                      {user.roles && user.roles.length > 5 && (
                        <Badge variant="outline">
                          +{user.roles.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="text-muted-foreground h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
