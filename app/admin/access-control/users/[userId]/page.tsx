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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Shield,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  getAllSystemRoles,
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
} from '@/types/rbac/role';
import {
  Permission,
  getPermissionLabel,
  groupPermissionsByCategory,
} from '@/types/rbac/permission';
import {
  getRolePermissions,
  getUserPermissionsWithGrants,
  getPermissionSources,
} from '@/lib/rbac/permissions';
import { AppLayout } from '@/components/common/app-layout';
import {
  UserPermissionGrant,
  GrantStatus,
  getGrantStatusLabel,
  getGrantStatusColor,
} from '@/types/rbac/user-permission';
import {
  getUserPermissionGrants,
  getExpiringGrants,
} from '@/components/shared/data/user-permission-grants';
import { mockUsers } from '@/components/shared/data/users';

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
  id?: number;
  name: string;
  email: string;
  roles?: string[];
  permissions?: Permission[];
  permissionGrants?: UserPermissionGrant[];
  createdAt?: Date;
  lastLogin?: string;
}

export default function UserAccessControlPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { isSystemAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [permissionGrants, setPermissionGrants] = useState<
    UserPermissionGrant[]
  >([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [directPermissions, setDirectPermissions] = useState<Permission[]>([]);
  const [originalDirectPermissions, setOriginalDirectPermissions] = useState<
    Permission[]
  >([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [hasPermissionChanges, setHasPermissionChanges] = useState(false);

  const systemRoles = getAllSystemRoles();

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      // Using mock data for now (backend integration pending)
      // Convert userId string to number for comparison
      const data = mockUsers.find((u) => u.id?.toString() === userId);

      if (!data) {
        toast.error('User not found');
        setUser(null);
        return;
      }

      setUser(data);
      setUserRoles(data.roles || []);

      // Load permission grants from mock data
      const grants = getUserPermissionGrants(userId);
      setPermissionGrants(grants);
    } catch (error) {
      toast.error('Failed to load user');
      logger.error(`${error}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    // Compute role-based permissions
    if (userRoles.length > 0) {
      const perms = getRolePermissions(userRoles);
      setUserPermissions(perms);
    } else {
      setUserPermissions([]);
    }

    // Compute all permissions (roles + grants)
    const allPerms = getUserPermissionsWithGrants(userRoles, permissionGrants);
    setAllPermissions(allPerms);
  }, [userRoles, permissionGrants]);

  // Check if there are permission changes
  useEffect(() => {
    const changed =
      JSON.stringify([...directPermissions].toSorted()) !==
      JSON.stringify([...originalDirectPermissions].toSorted());
    setHasPermissionChanges(changed);
  }, [directPermissions, originalDirectPermissions]);

  const handlePermissionToggle = (permission: Permission) => {
    if (isSystemAdminUser) {
      toast.error('Cannot modify System Admin permissions');
      return;
    }

    setDirectPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    if (!userId) return;

    try {
      setSavingPermissions(true);

      const response = await fetch(
        `/api/admin/users/${userId}/direct-permissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: directPermissions }),
        }
      );

      if (!response.ok) throw new Error('Failed to update permissions');

      setOriginalDirectPermissions(directPermissions);
      toast.success('Permissions updated successfully');
    } catch (error) {
      toast.error('Failed to update permissions');
      logger.error(`${error}`);
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleResetPermissions = () => {
    setDirectPermissions(originalDirectPermissions);
    toast.success('Changes reset');
  };

  const handleSelectAllPermissions = (permissions: Permission[]) => {
    if (isSystemAdminUser) {
      toast.error('Cannot modify System Admin permissions');
      return;
    }

    const allSelected = permissions.every((p) => directPermissions.includes(p));

    if (allSelected) {
      setDirectPermissions((prev) =>
        prev.filter((p) => !permissions.includes(p))
      );
    } else {
      const newPermissions = [...directPermissions];
      for (const p of permissions) {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      }
      setDirectPermissions(newPermissions);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole || !userId) return;
    if (userRoles.includes(selectedRole)) {
      toast.error('Role already assigned');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: [selectedRole] }),
      });

      if (!response.ok) throw new Error('Failed to add role');

      setUserRoles([...userRoles, selectedRole]);
      setSelectedRole('');
      toast.success(`Role "${getRoleDisplayName(selectedRole)}" assigned`);
    } catch (error) {
      toast.error('Failed to add role');
      logger.error(`${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!userId) return;

    if (roleId === 'system_admin') {
      const confirm = globalThis.confirm(
        'Are you sure you want to remove System Admin access? This will revoke all permissions.'
      );
      if (!confirm) return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: [roleId] }),
      });

      if (!response.ok) throw new Error('Failed to remove role');

      setUserRoles(userRoles.filter((r) => r !== roleId));
      toast.success(`Role "${getRoleDisplayName(roleId)}" removed`);
    } catch (error) {
      toast.error('Failed to remove role');
      logger.error(`${error}`);
    } finally {
      setSaving(false);
    }
  };

  const availableRoles = systemRoles.filter(
    (role) => !userRoles.includes(role)
  );
  const groupedPermissions = groupPermissionsByCategory();
  const isSystemAdminUser = userRoles.includes('system_admin');

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">
            Loading user access control...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">User Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The user you&apos;re looking for doesn&apos;t exist or has been
                deleted.
              </p>
              <Button
                onClick={() => router.push('/admin/access-control/users')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <User className="text-primary h-8 w-8" />
              {user.name}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          {isSystemAdminUser && (
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <Shield className="mr-1 h-4 w-4" />
              System Admin
            </Badge>
          )}
        </div>
        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">Roles ({userRoles.length})</TabsTrigger>
            <TabsTrigger value="permissions">
              All Permissions ({allPermissions.length})
            </TabsTrigger>
            <TabsTrigger value="direct-permissions">
              Direct Permissions
            </TabsTrigger>
            <TabsTrigger value="grants">
              Special Permissions ({permissionGrants.length})
            </TabsTrigger>
          </TabsList>
          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            {/* Add Role Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assign New Role</CardTitle>
                <CardDescription>
                  Add roles to grant this user specific permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a role to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.length === 0 ? (
                        <SelectItem value="none" disabled>
                          All roles assigned
                        </SelectItem>
                      ) : (
                        availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddRole}
                    disabled={!selectedRole || saving}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Current Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Current Roles ({userRoles.length})</CardTitle>
                <CardDescription>
                  Roles currently assigned to this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userRoles.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No roles assigned</p>
                    <p className="mt-1 text-sm">
                      Assign roles to grant permissions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userRoles.map((role) => {
                      const level = getRoleLevel(role);
                      const rolePermissions = getRolePermissions([role]);
                      return (
                        <div
                          key={role}
                          className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge className={getRoleLevelColor(level)}>
                                {getRoleDisplayName(role)}
                              </Badge>
                              {role === 'system_admin' && (
                                <Shield className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {rolePermissions.length} permissions granted
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(role)}
                            disabled={saving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            {isSystemAdminUser && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <Shield className="h-5 w-5" />
                    <p className="font-medium">
                      System Admin has full access to all permissions
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>All Permissions ({allPermissions.length})</CardTitle>
                <CardDescription>
                  Combined permissions from roles and special grants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allPermissions.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No permissions</p>
                    <p className="mt-1 text-sm">
                      Assign roles or grants to enable permissions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(
                      ([category, permissions]) => {
                        const userCategoryPerms = permissions.filter((p) =>
                          allPermissions.includes(p)
                        );
                        if (userCategoryPerms.length === 0) return null;

                        // Get permission sources
                        const sources = getPermissionSources(
                          userRoles,
                          permissionGrants
                        );

                        return (
                          <div key={category}>
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                              {category}
                              <Badge variant="secondary">
                                {userCategoryPerms.length}
                              </Badge>
                            </h3>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {userCategoryPerms.map((permission) => {
                                const source = sources[permission];
                                const isFromGrant = source?.fromGrants;
                                const isFromRole = source?.fromRoles;

                                return (
                                  <div
                                    key={permission}
                                    className="flex items-center justify-between gap-2 rounded border p-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                                      <span className="text-sm">
                                        {getPermissionLabel(permission)}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      {isFromRole && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Role
                                        </Badge>
                                      )}
                                      {isFromGrant && (
                                        <Badge
                                          variant="default"
                                          className="bg-purple-100 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                        >
                                          Grant
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <Separator className="mt-4" />
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Direct Permissions Tab */}
          <TabsContent value="direct-permissions" className="space-y-4">
            {/* Action Buttons */}
            {!isSystemAdminUser && hasPermissionChanges && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetPermissions}
                  disabled={savingPermissions}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}

            {isSystemAdminUser && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <Shield className="h-5 w-5" />
                    <p className="font-medium">
                      System Admin has full access to all permissions. Direct
                      permissions cannot be modified.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isSystemAdminUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Direct Permission Management</CardTitle>
                  <CardDescription>
                    Assign specific permissions to this user independently of
                    their roles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(groupedPermissions).map(
                    ([category, permissions]) => {
                      const categorySelected = permissions.filter((p) =>
                        directPermissions.includes(p)
                      );
                      const allSelected =
                        categorySelected.length === permissions.length;

                      return (
                        <div key={category}>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 font-semibold">
                              {category}
                              <Badge variant="secondary">
                                {categorySelected.length} / {permissions.length}
                              </Badge>
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSelectAllPermissions(permissions)
                              }
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {permissions.map((permission) => {
                              const isSelected =
                                directPermissions.includes(permission);
                              const isChanged =
                                isSelected !==
                                originalDirectPermissions.includes(permission);
                              const fromRole =
                                userPermissions.includes(permission);

                              return (
                                <div
                                  key={permission}
                                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                                    isChanged
                                      ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950'
                                      : fromRole
                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                                        : 'hover:bg-accent'
                                  }`}
                                >
                                  <Checkbox
                                    id={`direct-${permission}`}
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handlePermissionToggle(permission)
                                    }
                                  />
                                  <label
                                    htmlFor={`direct-${permission}`}
                                    className="flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    <div className="flex items-center gap-2">
                                      {getPermissionLabel(permission)}
                                      {fromRole && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          From Role
                                        </Badge>
                                      )}
                                      {isChanged && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {isSelected ? 'Added' : 'Removed'}
                                        </Badge>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <Separator className="mt-4" />
                        </div>
                      );
                    }
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Permission Grants Tab */}
          <TabsContent value="grants" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Active Grants</CardDescription>
                  <Shield className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      permissionGrants.filter(
                        (g) => g.status === GrantStatus.ACTIVE
                      ).length
                    }
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Currently effective
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Expiring Soon</CardDescription>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      getExpiringGrants().filter((g) => g.userId === userId)
                        .length
                    }
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Within 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Total Grants</CardDescription>
                  <Shield className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {permissionGrants.length}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    All time grants
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Grants List */}
            <Card>
              <CardHeader>
                <CardTitle>Permission Grants</CardTitle>
                <CardDescription>
                  Special permissions granted to this user beyond their role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionGrants.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="font-medium">No special permissions</p>
                    <p className="mt-1 text-sm">
                      This user only has permissions from their assigned roles
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {permissionGrants.map((grant) => {
                      const isExpired =
                        grant.expiresAt && grant.expiresAt < new Date();
                      const isExpiringSoon =
                        grant.expiresAt &&
                        grant.expiresAt > new Date() &&
                        grant.expiresAt <=
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <div
                          key={grant.id}
                          className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
                        >
                          {/* Grant Header */}
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {getPermissionLabel(grant.permission)}
                                </h4>
                                <Badge
                                  className={getGrantStatusColor(grant.status)}
                                >
                                  {getGrantStatusLabel(grant.status)}
                                </Badge>
                                {isExpiringSoon && (
                                  <Badge
                                    variant="outline"
                                    className="border-orange-300 text-orange-600"
                                  >
                                    Expiring Soon
                                  </Badge>
                                )}
                                {isExpired && (
                                  <Badge
                                    variant="outline"
                                    className="border-gray-300 text-gray-600"
                                  >
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              {grant.reason && (
                                <p className="text-muted-foreground text-sm">
                                  {grant.reason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Grant Details */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            {/* Granted Date */}
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-medium">
                                Granted
                              </p>
                              <p className="text-sm">
                                {new Date(grant.grantedAt).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Expiration */}
                            {grant.expiresAt && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Expires
                                </p>
                                <p
                                  className={`text-sm ${
                                    isExpired
                                      ? 'text-gray-600'
                                      : isExpiringSoon
                                        ? 'text-orange-600'
                                        : ''
                                  }`}
                                >
                                  {new Date(
                                    grant.expiresAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}

                            {/* Module */}
                            {grant.module && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Module
                                </p>
                                <Badge variant="outline">{grant.module}</Badge>
                              </div>
                            )}

                            {/* Scope */}
                            {grant.scope && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Scope
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {grant.scope.projectIds && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {grant.scope.projectIds.length} Projects
                                    </Badge>
                                  )}
                                  {grant.scope.organizationIds && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {grant.scope.organizationIds.length} Orgs
                                    </Badge>
                                  )}
                                  {grant.scope.resourceIds && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {grant.scope.resourceIds.length} Resources
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          {grant.metadata &&
                            Object.keys(grant.metadata).length > 0 && (
                              <div className="bg-muted mt-3 rounded p-2">
                                <p className="text-muted-foreground mb-1 text-xs font-medium">
                                  Additional Info
                                </p>
                                <div className="text-xs">
                                  {Object.entries(grant.metadata).map(
                                    ([key, value]) => (
                                      <div key={key} className="flex gap-2">
                                        <span className="text-muted-foreground">
                                          {key}:
                                        </span>
                                        <span>{String(value)}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
