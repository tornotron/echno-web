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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  getRoleDisplayName,
  getRoleLevel,
  RoleLevel,
  getAllSystemRoles,
} from '@/types/rbac/role';
import {
  Permission,
  getPermissionLabel,
  groupPermissionsByCategory,
} from '@/types/rbac/permission';
import { getRolePermissions } from '@/lib/rbac/permissions';
import { AppLayout } from '@/components/common/app-layout';

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
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>(
    []
  );
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setRoleId(p.roleId));
  }, [params]);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  const fetchRoleData = useCallback(async () => {
    if (!roleId) return;

    try {
      setLoading(true);

      // Verify role exists
      const allRoles = getAllSystemRoles();
      if (!allRoles.includes(roleId)) {
        toast.error('Role not found');
        return;
      }

      // Get role permissions
      const permissions = getRolePermissions([roleId]);
      setOriginalPermissions(permissions);
      setSelectedPermissions(permissions);
    } catch (error) {
      toast.error('Failed to load role data');
      logger.error(`${error}`);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    fetchRoleData();
  }, [fetchRoleData]);

  // Check if there are changes
  useEffect(() => {
    const changed =
      JSON.stringify([...selectedPermissions].toSorted()) !==
      JSON.stringify([...originalPermissions].toSorted());
    setHasChanges(changed);
  }, [selectedPermissions, originalPermissions]);

  const handlePermissionToggle = (permission: Permission) => {
    if (roleId === 'system-admin') {
      toast.error('Cannot modify System Admin permissions');
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = async () => {
    if (!roleId) return;

    try {
      setSaving(true);

      // In production, this would call an API endpoint
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      if (!response.ok) throw new Error('Failed to update permissions');

      setOriginalPermissions(selectedPermissions);
      toast.success('Permissions updated successfully');
    } catch (error) {
      toast.error('Failed to update permissions');
      logger.error(`${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedPermissions(originalPermissions);
    toast.success('Changes reset');
  };

  const handleSelectAll = (permissions: Permission[]) => {
    if (roleId === 'system-admin') {
      toast.error('Cannot modify System Admin permissions');
      return;
    }

    const allSelected = permissions.every((p) =>
      selectedPermissions.includes(p)
    );

    if (allSelected) {
      // Deselect all
      setSelectedPermissions((prev) =>
        prev.filter((p) => !permissions.includes(p))
      );
    } else {
      // Select all
      const newPermissions = [...selectedPermissions];
      for (const p of permissions) {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      }
      setSelectedPermissions(newPermissions);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (!roleId || !getAllSystemRoles().includes(roleId)) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">Role Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The role you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button
                onClick={() => router.push('/admin/access-control/roles')}
              >
                Back to Roles
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const roleName = getRoleDisplayName(roleId);
  const level = getRoleLevel(roleId);
  const isSystemAdminRole = roleId === 'system-admin';
  const groupedPermissions = groupPermissionsByCategory();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Shield className="text-primary h-8 w-8" />
              {roleName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSystemAdminRole
                ? 'Full system access - Cannot be modified'
                : 'Manage role permissions and access levels'}
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

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Summary</CardTitle>
            <CardDescription>
              Current permission assignments for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Permissions
                </p>
                <p className="text-2xl font-bold">
                  {isSystemAdminRole ? 'All' : selectedPermissions.length}
                </p>
              </div>
              {hasChanges && (
                <>
                  <div>
                    <p className="text-muted-foreground text-sm">Added</p>
                    <p className="text-2xl font-bold text-green-600">
                      +
                      {
                        selectedPermissions.filter(
                          (p) => !originalPermissions.includes(p)
                        ).length
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Removed</p>
                    <p className="text-2xl font-bold text-red-600">
                      -
                      {
                        originalPermissions.filter(
                          (p) => !selectedPermissions.includes(p)
                        ).length
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        {isSystemAdminRole ? (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto mb-4 h-16 w-16 text-red-600" />
              <h3 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-200">
                System Administrator
              </h3>
              <p className="text-muted-foreground">
                This role has unrestricted access to all system functions and
                permissions. Permissions cannot be modified for this role.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Select or deselect permissions to modify role access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedPermissions).map(
                ([category, permissions]) => {
                  const categorySelected = permissions.filter((p) =>
                    selectedPermissions.includes(p)
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
                        <div className="flex items-center gap-2">
                          {hasChanges && (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                              >
                                <Save className="mr-1 h-3 w-3" />
                                Save Changes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={saving}
                              >
                                <RotateCcw className="mr-1 h-3 w-3" />
                                Reset
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAll(permissions)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {permissions.map((permission) => {
                          const isSelected =
                            selectedPermissions.includes(permission);
                          const isChanged =
                            isSelected !==
                            originalPermissions.includes(permission);

                          return (
                            <div
                              key={permission}
                              className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                                isChanged
                                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950'
                                  : 'hover:bg-accent'
                              }`}
                            >
                              <Checkbox
                                id={permission}
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handlePermissionToggle(permission)
                                }
                              />
                              <label
                                htmlFor={permission}
                                className="flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {getPermissionLabel(permission)}
                                {isChanged && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs"
                                  >
                                    {isSelected ? 'Added' : 'Removed'}
                                  </Badge>
                                )}
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
      </div>
    </AppLayout>
  );
}
