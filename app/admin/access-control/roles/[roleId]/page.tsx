'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
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
  Shield,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Users,
  Key,
  CheckCircle2,
  Lock,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
  getAllSystemRoles,
} from '@/types/rbac/role';
import { ROLE_TO_GROUP, getGroupDisplayName } from '@/lib/rbac/role-groups';
import { mockUsers } from '@/components/shared/data/users';
import { RESOURCES, RESOURCE_SCOPES } from '@/lib/rbac/resource-permissions';

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

export default function RoleDetailsPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { isSystemAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [roleId, setRoleId] = useState<string | null>(null);

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setRoleId(p.roleId));
  }, [params]);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  // Get users with this role
  const usersWithRole = useMemo(() => {
    if (!roleId) return [];
    return mockUsers.filter((user) => user.roles?.includes(roleId));
  }, [roleId]);

  // Generate mock permissions based on role level (for visualization)
  const rolePermissions = useMemo(() => {
    if (!roleId) return [];
    const level = getRoleLevel(roleId);
    const resources = Object.values(RESOURCES).filter(
      (r) => r !== 'Default Resource'
    );

    // System admin has all permissions
    if (roleId === 'system-admin') {
      return resources.map((resource) => ({
        resource,
        scopes: Object.values(RESOURCE_SCOPES),
      }));
    }

    // Generate permissions based on level
    const scopesByLevel: Record<RoleLevel, string[]> = {
      [RoleLevel.ADMIN]: ['view', 'create', 'update', 'delete', 'manage'],
      [RoleLevel.MANAGEMENT]: ['view', 'create', 'update', 'manage'],
      [RoleLevel.PROFESSIONAL]: ['view', 'create', 'update'],
      [RoleLevel.SUPERVISORY]: ['view', 'create', 'update'],
      [RoleLevel.SKILLED]: ['view', 'create'],
      [RoleLevel.GENERAL]: ['view'],
      [RoleLevel.EXTERNAL]: ['view'],
      [RoleLevel.TRAINEE]: ['view'],
    };

    const scopes = scopesByLevel[level] || ['view'];

    // Return subset of resources based on role
    return resources
      .slice(0, Math.min(resources.length, 5))
      .map((resource) => ({
        resource,
        scopes,
      }));
  }, [roleId]);

  if (isLoading || !roleId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!getAllSystemRoles().includes(roleId)) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">Role Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The role you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/admin/access-control/roles')}>
              Back to Roles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleName = getRoleDisplayName(roleId);
  const level = getRoleLevel(roleId);
  const isSystemAdminRole = roleId === 'system-admin';
  const associatedGroup = ROLE_TO_GROUP[roleId];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/access-control/roles')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Roles
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Shield className="text-primary h-8 w-8" />
            {roleName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Role details and configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getRoleLevelColor(level)}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
          {isSystemAdminRole && (
            <Badge className="bg-red-600 text-white">
              <Shield className="mr-1 h-4 w-4" />
              Full Access
            </Badge>
          )}
        </div>
      </div>

      {/* Keycloak Notice */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertTitle>Permissions Managed in Keycloak</AlertTitle>
        <AlertDescription>
          Role permissions are now managed through Keycloak Authorization
          Services. To view or modify permissions for this role, access the
          Keycloak Admin Console.
        </AlertDescription>
      </Alert>

      {/* Role Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>Details about this role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Role ID</p>
              <p className="font-mono text-sm">{roleId}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Display Name</p>
              <p className="font-medium">{roleName}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Level</p>
              <Badge className={getRoleLevelColor(level)}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                Associated Group
              </p>
              <p className="font-medium">
                {associatedGroup
                  ? getGroupDisplayName(associatedGroup)
                  : 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Admin Role Notice */}
      {isSystemAdminRole && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="py-8 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-red-600" />
            <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
              System Administrator
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              This role has unrestricted access to all system functions and
              resources. Users with this role bypass all permission checks.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Permissions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            Resources and actions this role can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSystemAdminRole ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-red-50/50 p-6 text-center dark:border-red-800 dark:bg-red-900/10">
              <Lock className="mx-auto mb-3 h-8 w-8 text-red-500" />
              <p className="font-medium text-red-700 dark:text-red-300">
                Full System Access
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                System Admin bypasses all permission checks
              </p>
            </div>
          ) : rolePermissions.length > 0 ? (
            <div className="space-y-4">
              {rolePermissions.map((perm) => (
                <div key={perm.resource} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium capitalize">
                      {perm.resource}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {perm.scopes.map((scope) => {
                      const icons: Record<string, React.ReactNode> = {
                        view: <Eye className="mr-1 h-3 w-3" />,
                        create: <Edit3 className="mr-1 h-3 w-3" />,
                        update: <Edit3 className="mr-1 h-3 w-3" />,
                        delete: <Trash2 className="mr-1 h-3 w-3" />,
                        manage: <Shield className="mr-1 h-3 w-3" />,
                      };
                      return (
                        <Badge
                          key={scope}
                          variant="outline"
                          className="flex items-center gap-1 capitalize"
                        >
                          {icons[scope]}
                          {scope}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Lock className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">
                No specific permissions assigned
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users with this Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users with this Role ({usersWithRole.length})
          </CardTitle>
          <CardDescription>
            Users currently assigned to this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersWithRole.length > 0 ? (
            <div className="space-y-3">
              {usersWithRole.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600">
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/access-control/users/${user.id}`)
                    }
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    View
                  </Button>
                </div>
              ))}
              {usersWithRole.length > 5 && (
                <p className="text-center text-sm text-zinc-500">
                  And {usersWithRole.length - 5} more users...
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">
                No users assigned to this role
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
