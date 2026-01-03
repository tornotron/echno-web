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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertCircle,
  Save,
  RotateCcw,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  Module,
  EntitlementStatus,
  UserModuleEntitlement,
} from '@/types/rbac/module';
import { Organization } from '@/types/organization/organization';
import { mockModuleEntitlements } from '@/components/shared/data/module-entitlements';
import { mockOrganizations } from '@/components/shared/data/organizations';
import { AppLayout } from '@/components/common/app-layout';

// Helper function to get module display name
function getModuleDisplayName(module: Module): string {
  return module
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get status color
function getStatusColor(status: EntitlementStatus): string {
  const colors: Record<EntitlementStatus, string> = {
    [EntitlementStatus.ACTIVE]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [EntitlementStatus.TRIAL]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [EntitlementStatus.SUSPENDED]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [EntitlementStatus.EXPIRED]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    [EntitlementStatus.PENDING]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return colors[status];
}

interface EntitlementForm {
  isEnabled: boolean;
  isPurchased: boolean;
  status: EntitlementStatus;
  expiresAt: string;
  licenseType: 'trial' | 'paid' | 'enterprise' | 'free';
  seats: number;
  features: string[];
}

export default function ManageOrganizationEntitlementPage({
  params,
}: {
  params: Promise<{ moduleId: string; organizationId: string }>;
}) {
  const { isSystemAdmin, isLoading } = useAuthorization();
  const router = useRouter();

  const [moduleId, setModuleId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<UserModuleEntitlement | null>(
    null
  );
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<EntitlementForm>({
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.PENDING,
    expiresAt: '',
    licenseType: 'free',
    seats: 0,
    features: [],
  });

  const [originalFormData, setOriginalFormData] = useState<EntitlementForm>({
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.PENDING,
    expiresAt: '',
    licenseType: 'free',
    seats: 0,
    features: [],
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => {
      setModuleId(p.moduleId);
      setOrganizationId(p.organizationId);
    });
  }, [params]);

  // Redirect if not system admin
  if (!isLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  const fetchData = useCallback(async () => {
    if (!moduleId || !organizationId) return;

    try {
      setLoading(true);

      // Find entitlement
      const ent = mockModuleEntitlements.find(
        (e) => e.module === moduleId && e.organizationId === organizationId
      );

      if (!ent) {
        toast.error('Entitlement not found');
        return;
      }

      // Find organization
      const org = mockOrganizations.find(
        (o) => o.id?.toString() === organizationId
      );

      setEntitlement(ent);
      setOrganization(org || null);

      // Initialize form data
      const initialData: EntitlementForm = {
        isEnabled: ent.isEnabled,
        isPurchased: ent.isPurchased,
        status: ent.status,
        expiresAt: ent.expiresAt
          ? new Date(ent.expiresAt).toISOString().split('T')[0]
          : '',
        licenseType: ent.license?.type || 'free',
        seats: ent.license?.seats || 0,
        features: ent.license?.features || [],
      };

      setFormData(initialData);
      setOriginalFormData(initialData);
    } catch (error) {
      toast.error('Failed to load data');
      logger.error(`${error}`);
    } finally {
      setLoading(false);
    }
  }, [moduleId, organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check for changes
  useEffect(() => {
    const changed =
      JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasChanges(changed);
  }, [formData, originalFormData]);

  const handleSave = async () => {
    if (!moduleId || !organizationId) return;

    try {
      setSaving(true);

      // In production, this would call an API
      const response = await fetch(
        `/api/admin/modules/${moduleId}/organizations/${organizationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to update entitlement');

      setOriginalFormData(formData);
      toast.success('Entitlement updated successfully');
    } catch (error) {
      toast.error('Failed to update entitlement');
      logger.error(`${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalFormData);
    toast.success('Changes reset');
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    if (formData.features.includes(newFeature.trim())) {
      toast.error('Feature already exists');
      return;
    }

    setFormData({
      ...formData,
      features: [...formData.features, newFeature.trim()],
    });
    setNewFeature('');
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((f) => f !== feature),
    });
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">
            Loading entitlement details...
          </p>
        </div>
      </div>
    );
  }

  if (!entitlement || !organization) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">
                Entitlement Not Found
              </h2>
              <p className="text-muted-foreground mb-4">
                The entitlement you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button
                onClick={() =>
                  router.push(`/admin/access-control/modules/${moduleId}`)
                }
              >
                Back to Module
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const moduleName = getModuleDisplayName(moduleId as Module);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Building2 className="text-primary h-8 w-8" />
              Manage Entitlement
            </h1>
            <p className="text-muted-foreground mt-1">
              {organization.organizationName} • {moduleName}
            </p>
          </div>
          <Badge className={getStatusColor(formData.status)}>
            {formData.status}
          </Badge>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        )}

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-xs">
                Organization Name
              </Label>
              <p className="font-medium">{organization.organizationName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-sm">{organization.organizationEmail}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Phone</Label>
              <p className="text-sm">{organization.organizationPhone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Type</Label>
              <Badge variant="outline">{organization.type}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Entitlement Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Entitlement Configuration</CardTitle>
            <CardDescription>
              Manage module access and licensing for this organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Settings */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as EntitlementStatus,
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EntitlementStatus.ACTIVE}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value={EntitlementStatus.TRIAL}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Trial
                      </div>
                    </SelectItem>
                    <SelectItem value={EntitlementStatus.SUSPENDED}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Suspended
                      </div>
                    </SelectItem>
                    <SelectItem value={EntitlementStatus.EXPIRED}>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-600" />
                        Expired
                      </div>
                    </SelectItem>
                    <SelectItem value={EntitlementStatus.PENDING}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type</Label>
                <Select
                  value={formData.licenseType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      licenseType: value as
                        | 'trial'
                        | 'paid'
                        | 'enterprise'
                        | 'free',
                    })
                  }
                >
                  <SelectTrigger id="licenseType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min="0"
                  value={formData.seats}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seats: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiry Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Toggle Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: checked as boolean })
                  }
                />
                <Label
                  htmlFor="isEnabled"
                  className="cursor-pointer font-normal"
                >
                  Module is enabled for this organization
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPurchased"
                  checked={formData.isPurchased}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isPurchased: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="isPurchased"
                  className="cursor-pointer font-normal"
                >
                  Module has been purchased/licensed
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>License Features</CardTitle>
            <CardDescription>
              Specific features included in this license
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a feature..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <Button onClick={handleAddFeature}>Add</Button>
            </div>

            {formData.features.length > 0 ? (
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(feature)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No features configured. Add features to specify what&apos;s
                included in this license.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Entitlement Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-sm">Module</p>
                <p className="font-medium">{moduleName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Granted</p>
                <p className="text-sm">
                  {new Date(entitlement.grantedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Expires</p>
                <p className="text-sm">
                  {formData.expiresAt
                    ? new Date(formData.expiresAt).toLocaleDateString()
                    : 'No expiry'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Seats</p>
                <p className="flex items-center gap-1 font-medium">
                  <Users className="h-4 w-4" />
                  {formData.seats}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
