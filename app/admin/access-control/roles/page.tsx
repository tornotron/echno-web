'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  getAllSystemRoles,
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
} from '@/types/rbac/role';
import {
  getPermissionLabel,
  groupPermissionsByCategory,
} from '@/types/rbac/permission';
import { getRolePermissions } from '@/lib/rbac/permissions';
import {
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export default function RolesPage() {
  const { isSuperAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // Redirect if not super admin
  if (!isLoading && !isSuperAdmin) {
    redirect('/users/dashboard');
  }

  const systemRoles = getAllSystemRoles();

  const filteredRoles = systemRoles.filter((role) => {
    const matchesSearch = getRoleDisplayName(role)
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesLevel =
      levelFilter === 'all' || getRoleLevel(role) === levelFilter;
    return matchesSearch && matchesLevel;
  });

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

  const toggleRole = (roleId: string) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
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
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/access-control')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Shield className="text-primary h-8 w-8" />
              Role Browser
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore all system roles and their permissions
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Roles</CardDescription>
            <CardTitle className="text-3xl">{systemRoles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              System-defined roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Role Categories</CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Admin, Management, Professional, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Permissions</CardDescription>
            <CardTitle className="text-3xl">120+</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Granular access controls
            </p>
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
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.values(RoleLevel).map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground mt-4 text-sm">
            Showing {filteredRoles.length} of {systemRoles.length} roles
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <div className="space-y-3">
        {filteredRoles.map((roleId) => {
          const level = getRoleLevel(roleId);
          const permissions = getRolePermissions([roleId]);
          const groupedPermissions = groupPermissionsByCategory();
          const isExpanded = expandedRole === roleId;

          return (
            <Card key={roleId} className="overflow-hidden">
              <div
                className="hover:bg-accent/50 flex cursor-pointer items-center justify-between p-4 transition-colors"
                onClick={() => toggleRole(roleId)}
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {getRoleDisplayName(roleId)}
                    </h3>
                    <Badge className={getRoleLevelColor(level)}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Badge>
                    {roleId === 'super_admin' && (
                      <Badge className="bg-red-600 text-white">
                        <Shield className="mr-1 h-3 w-3" />
                        Full Access
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {permissions.length} permissions
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="text-muted-foreground h-5 w-5" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-5 w-5" />
                )}
              </div>

              {isExpanded && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    {roleId === 'super_admin' ? (
                      <div className="py-8 text-center">
                        <Shield className="mx-auto mb-4 h-12 w-12 text-red-600" />
                        <p className="mb-2 font-semibold">
                          Super Administrator
                        </p>
                        <p className="text-muted-foreground text-sm">
                          This role has unrestricted access to all system
                          functions and permissions.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupedPermissions).map(
                          ([category, categoryPerms]) => {
                            const rolePerms = categoryPerms.filter((p) =>
                              permissions.includes(p)
                            );
                            if (rolePerms.length === 0) return null;

                            return (
                              <div key={category}>
                                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                                  {category}
                                  <Badge variant="secondary">
                                    {rolePerms.length}
                                  </Badge>
                                </h4>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                  {rolePerms.map((permission) => (
                                    <div
                                      key={permission}
                                      className="flex items-center gap-2 rounded border p-2 text-sm"
                                    >
                                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                                      <span>
                                        {getPermissionLabel(permission)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
