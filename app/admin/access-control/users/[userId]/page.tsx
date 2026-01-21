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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Shield,
  Plus,
  X,
  AlertCircle,
  User,
  ExternalLink,
  Key,
  Lock,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RESOURCES, RESOURCE_SCOPES } from '@/lib/rbac/resource-permissions';
import { toast } from '@/lib/styles/toast-styles';
import {
  getAllSystemRoles,
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
} from '@/types/rbac/role';
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

interface UserData {
  id?: number;
  name: string;
  email: string;
  roles?: string[];
  createdAt?: Date;
  lastLogin?: string;
}

interface UserPermission {
  id: string;
  resource: string;
  scope: string;
  grantedAt?: Date;
  grantedBy?: string;
}

export default function UserAccessControlPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { isSystemAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Permission management state
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('');
  const [savingPermission, setSavingPermission] = useState(false);

  const systemRoles = getAllSystemRoles();
  const resourceList = Object.values(RESOURCES).filter(
    (r) => r !== 'Default Resource'
  );
  const scopeList = Object.values(RESOURCE_SCOPES);

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
      const data = mockUsers.find((u) => u.id?.toString() === userId);

      if (!data) {
        toast.error('User not found');
        setUser(null);
        return;
      }

      setUser(data);
      setUserRoles(data.roles || []);
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
  const isSystemAdminUser = userRoles.includes('system-admin');

  // Check if permission already exists
  const permissionExists = (resource: string, scope: string) => {
    return userPermissions.some(
      (p) => p.resource === resource && p.scope === scope
    );
  };

  const handleAddPermission = async () => {
    if (!selectedResource || !selectedScope || !userId) return;
    if (permissionExists(selectedResource, selectedScope)) {
      toast.error('Permission already assigned');
      return;
    }

    try {
      setSavingPermission(true);
      // TODO: API call to add permission in Keycloak
      // For now, we'll add it locally
      const newPermission: UserPermission = {
        id: `${selectedResource}:${selectedScope}`,
        resource: selectedResource,
        scope: selectedScope,
        grantedAt: new Date(),
      };
      setUserPermissions([...userPermissions, newPermission]);
      setSelectedResource('');
      setSelectedScope('');
      toast.success(
        `Permission "${selectedResource}:${selectedScope}" granted`
      );
    } catch (error) {
      toast.error('Failed to add permission');
      logger.error(`${error}`);
    } finally {
      setSavingPermission(false);
    }
  };

  const handleRemovePermission = async (permission: UserPermission) => {
    if (!userId) return;

    try {
      setSavingPermission(true);
      // TODO: API call to remove permission in Keycloak
      setUserPermissions(userPermissions.filter((p) => p.id !== permission.id));
      toast.success(
        `Permission "${permission.resource}:${permission.scope}" revoked`
      );
    } catch (error) {
      toast.error('Failed to remove permission');
      logger.error(`${error}`);
    } finally {
      setSavingPermission(false);
    }
  };

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
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">User Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The user you&apos;re looking for doesn&apos;t exist or has been
              deleted.
            </p>
            <Button onClick={() => router.push('/admin/access-control/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/access-control/users')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Button>

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

      {/* Keycloak Notice */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertTitle>Permissions Managed in Keycloak</AlertTitle>
        <AlertDescription>
          User permissions are now managed through Keycloak Authorization
          Services. Role assignments here sync with Keycloak. For detailed
          permission management, access the Keycloak Admin Console.
        </AlertDescription>
      </Alert>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Basic user details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">User ID</p>
              <p className="font-mono text-sm">{userId}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Name</p>
              <p className="text-sm">{user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Last Login</p>
              <p className="text-sm">{user.lastLogin || 'Never'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Admin Notice */}
      {isSystemAdminUser && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="py-6 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-red-600" />
            <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
              System Administrator
            </h3>
            <p className="text-muted-foreground text-sm">
              This user has unrestricted access to all system functions and
              resources. System administrators bypass all permission checks.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Role Assignment Card */}
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
            <Button onClick={handleAddRole} disabled={!selectedRole || saving}>
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
              <p className="mt-1 text-sm">Assign roles to grant permissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userRoles.map((role) => {
                const level = getRoleLevel(role);
                const isSystemAdminRole = role === 'system-admin';
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
                        {isSystemAdminRole && (
                          <Shield className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {level.charAt(0).toUpperCase() + level.slice(1)}-level
                        role
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          className="text-zinc-500 hover:text-red-600"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove {isSystemAdminRole ? 'System Admin' : ''}{' '}
                            Role
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isSystemAdminRole ? (
                              <>
                                Are you sure you want to remove{' '}
                                <strong>System Admin</strong> access from this
                                user? This will revoke all administrative
                                permissions and they will lose access to system
                                settings.
                              </>
                            ) : (
                              <>
                                Are you sure you want to remove the{' '}
                                <strong>{getRoleDisplayName(role)}</strong> role
                                from this user? They will lose all permissions
                                associated with this role.
                              </>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveRole(role)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove Role
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Permissions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Individual Permissions
          </CardTitle>
          <CardDescription>
            Grant specific resource permissions directly to this user (beyond
            their role permissions)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Permission Form */}
          <div className="rounded-lg border border-dashed p-4">
            <h4 className="mb-3 text-sm font-medium">Add New Permission</h4>
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedResource}
                onValueChange={setSelectedResource}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {resourceList.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center text-zinc-400">:</span>
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {scopeList.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddPermission}
                disabled={
                  !selectedResource || !selectedScope || savingPermission
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Grant Permission
              </Button>
            </div>
            {selectedResource && selectedScope && (
              <p className="mt-2 text-xs text-zinc-500">
                This will grant{' '}
                <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                  {selectedResource}:{selectedScope}
                </code>{' '}
                permission to this user
              </p>
            )}
          </div>

          {/* Current Permissions List */}
          <div>
            <h4 className="mb-3 text-sm font-medium">
              Current Individual Permissions ({userPermissions.length})
            </h4>
            {userPermissions.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No individual permissions assigned</p>
                <p className="mt-1 text-sm">
                  This user&apos;s access is based on their roles only
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/20">
                        <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <code className="text-sm font-medium">
                          {permission.resource}:{permission.scope}
                        </code>
                        {permission.grantedAt && (
                          <p className="text-xs text-zinc-500">
                            Granted{' '}
                            {new Date(
                              permission.grantedAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={savingPermission}
                          className="text-zinc-500 hover:text-red-600"
                        >
                          {savingPermission ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Permission</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke the{' '}
                            <strong>
                              {permission.resource}:{permission.scope}
                            </strong>{' '}
                            permission from this user? They will no longer have
                            direct access to this resource.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemovePermission(permission)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Revoke Permission
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Note */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>About Individual Permissions</AlertTitle>
            <AlertDescription>
              Individual permissions are in addition to role-based permissions.
              They allow you to grant specific access to a user without changing
              their role. These permissions are managed in Keycloak as
              user-specific policies.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
