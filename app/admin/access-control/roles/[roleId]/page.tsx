'use client';

import { useEffect, useState } from 'react';
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
import { Shield, AlertCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import {
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
  getAllSystemRoles,
} from '@/types/rbac/role';
import { ROLE_TO_GROUP, getGroupDisplayName } from '@/lib/rbac/role-groups';

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

  if (isLoading || !roleId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading role details...</p>
        </div>
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

      {/* System Admin Role */}
      {isSystemAdminRole && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto mb-4 h-16 w-16 text-red-600" />
            <h3 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-200">
              System Administrator
            </h3>
            <p className="text-muted-foreground">
              This role has unrestricted access to all system functions and
              resources. Users with this role bypass all permission checks.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
