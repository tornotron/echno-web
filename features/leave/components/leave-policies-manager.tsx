'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Switch } from '@/components/shadcn/switch';
import { useAllLeavePolicies } from '@/hooks/leave/use-leave';
import {
  useCreateLeavePolicy,
  useUpdateLeavePolicy,
  useDeleteLeavePolicy,
  useActivateLeavePolicy,
} from '@/hooks/leave/use-leave-mutations';
import { LeavePolicy } from '@/types/leave';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Separator } from '@/components/shadcn/separator';
import { ConfirmationDialog } from '@/features/leave/components/confirmation-dialog';

interface LeavePoliciesManagerProps {
  organizationId: number;
}

export function LeavePoliciesManager({
  organizationId,
}: LeavePoliciesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deactivatingPolicyId, setDeactivatingPolicyId] = useState<
    number | null
  >(null);

  const { data: policies, isLoading } = useAllLeavePolicies();
  const createMutation = useCreateLeavePolicy();
  const updateMutation = useUpdateLeavePolicy();
  const deleteMutation = useDeleteLeavePolicy();
  const activateMutation = useActivateLeavePolicy();

  const [formData, setFormData] = useState({
    leaveTypeCode: '',
    leaveTypeName: '',
    description: '',
    annualQuota: 12,
    accrualRatePerMonth: 1,
    carryForwardLimit: 5,
    carryForwardExpiryMonths: 3,
    minDaysPerRequest: 0.5,
    maxDaysPerRequest: 5,
    advanceNoticeDays: 2,
    requiresAttachment: false,
    attachmentRequiredAfterDays: 3,
    applicableGenders: 'ALL',
    minServiceMonths: 0,
    allowHalfDay: true,
    isPaid: true,
    displayOrder: 0,
  });

  const resetForm = () => {
    setFormData({
      leaveTypeCode: '',
      leaveTypeName: '',
      description: '',
      annualQuota: 12,
      accrualRatePerMonth: 1,
      carryForwardLimit: 5,
      carryForwardExpiryMonths: 3,
      minDaysPerRequest: 0.5,
      maxDaysPerRequest: 5,
      advanceNoticeDays: 2,
      requiresAttachment: false,
      attachmentRequiredAfterDays: 3,
      applicableGenders: 'ALL',
      minServiceMonths: 0,
      allowHalfDay: true,
      isPaid: true,
      displayOrder: 0,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        organizationId,
        ...formData,
      },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleEdit = () => {
    if (!editingPolicy) return;

    updateMutation.mutate(
      {
        policyId: editingPolicy.id,
        updates: formData,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingPolicy(null);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (policyId: number) => {
    setDeactivatingPolicyId(policyId);
  };

  const handleConfirmDeactivate = () => {
    if (deactivatingPolicyId === null) return;

    deleteMutation.mutate(deactivatingPolicyId, {
      onSuccess: () => {
        setDeactivatingPolicyId(null);
      },
      onError: () => {
        setDeactivatingPolicyId(null);
      },
    });
  };

  const handleActivate = (policyId: number) => {
    activateMutation.mutate(policyId);
  };

  const openEditDialog = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    setFormData({
      leaveTypeCode: policy.leaveTypeCode,
      leaveTypeName: policy.leaveTypeName,
      description: policy.description || '',
      annualQuota: policy.annualQuota,
      accrualRatePerMonth: policy.accrualRatePerMonth,
      carryForwardLimit: policy.carryForwardLimit,
      carryForwardExpiryMonths: policy.carryForwardExpiryMonths || 3,
      minDaysPerRequest: policy.minDaysPerRequest,
      maxDaysPerRequest: policy.maxDaysPerRequest || 5,
      advanceNoticeDays: policy.advanceNoticeDays,
      requiresAttachment: policy.requiresAttachment,
      attachmentRequiredAfterDays: policy.attachmentRequiredAfterDays || 3,
      applicableGenders: policy.applicableGenders,
      minServiceMonths: policy.minServiceMonths,
      allowHalfDay: policy.allowHalfDay,
      isPaid: policy.isPaid,
      displayOrder: policy.displayOrder,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Leave Policies
          </CardTitle>
          <CardDescription className="text-xs">
            Loading leave policies...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">
              Leave Policies
            </CardTitle>
            <CardDescription className="text-xs">
              Manage leave types and their rules for your organization
            </CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Leave Policy</DialogTitle>
                <DialogDescription>
                  Define a new leave type with its rules and quotas.
                </DialogDescription>
              </DialogHeader>
              <PolicyForm formData={formData} setFormData={setFormData} />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Policy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {policies && policies.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {policies.map((policy) => (
                <Card key={policy.id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {policy.leaveTypeName}
                          {!policy.isPaid && (
                            <Badge variant="outline" className="ml-2">
                              Unpaid
                            </Badge>
                          )}
                        </p>
                        <code className="text-xs text-zinc-500 dark:text-zinc-400">
                          {policy.leaveTypeCode}
                        </code>
                      </div>
                      <Badge
                        variant={policy.isActive ? 'default' : 'secondary'}
                      >
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          Annual Quota
                        </p>
                        <p className="font-medium">{policy.annualQuota} days</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          Carry Forward
                        </p>
                        <p className="font-medium">
                          {policy.carryForwardLimit} days
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(policy)}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      {policy.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(policy.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleActivate(policy.id)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Annual Quota</TableHead>
                    <TableHead>Carry Forward</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.leaveTypeName}
                        {!policy.isPaid && (
                          <Badge variant="outline" className="ml-2">
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
                          {policy.leaveTypeCode}
                        </code>
                      </TableCell>
                      <TableCell>{policy.annualQuota} days</TableCell>
                      <TableCell>{policy.carryForwardLimit} days</TableCell>
                      <TableCell>
                        <Badge
                          variant={policy.isActive ? 'default' : 'secondary'}
                        >
                          {policy.isActive ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(policy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {policy.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(policy.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(policy.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <p>No leave policies defined yet.</p>
            <p className="text-sm">Create your first policy to get started.</p>
          </div>
        )}

        {/* Deactivation Confirmation Dialog */}
        <ConfirmationDialog
          open={deactivatingPolicyId !== null}
          onOpenChange={(open) => {
            if (!open) setDeactivatingPolicyId(null);
          }}
          title="Deactivate Leave Policy"
          description="Are you sure you want to deactivate this policy? Employees will no longer be able to apply for this leave type."
          confirmLabel="Deactivate"
          variant="destructive"
          onConfirm={handleConfirmDeactivate}
          isLoading={deleteMutation.isPending}
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Leave Policy</DialogTitle>
              <DialogDescription>
                Update the leave policy settings.
              </DialogDescription>
            </DialogHeader>
            <PolicyForm formData={formData} setFormData={setFormData} />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingPolicy(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface PolicyFormProps {
  formData: {
    leaveTypeCode: string;
    leaveTypeName: string;
    description: string;
    annualQuota: number;
    accrualRatePerMonth: number;
    carryForwardLimit: number;
    carryForwardExpiryMonths: number;
    minDaysPerRequest: number;
    maxDaysPerRequest: number;
    advanceNoticeDays: number;
    requiresAttachment: boolean;
    attachmentRequiredAfterDays: number;
    applicableGenders: string;
    minServiceMonths: number;
    allowHalfDay: boolean;
    isPaid: boolean;
    displayOrder: number;
  };
  setFormData: (data: PolicyFormProps['formData']) => void;
}

function PolicyForm({ formData, setFormData }: PolicyFormProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Basic Information */}
      <div>
        <h4 className="text-muted-foreground mb-3 text-sm font-medium">
          Basic Information
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leaveTypeName">Leave Type Name *</Label>
            <Input
              id="leaveTypeName"
              value={formData.leaveTypeName}
              onChange={(e) =>
                setFormData({ ...formData, leaveTypeName: e.target.value })
              }
              placeholder="Casual Leave"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leaveTypeCode">Code *</Label>
            <Input
              id="leaveTypeCode"
              value={formData.leaveTypeCode}
              onChange={(e) =>
                setFormData({ ...formData, leaveTypeCode: e.target.value })
              }
              placeholder="CL"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="For personal matters..."
          />
        </div>
      </div>

      <Separator />

      {/* Quota & Accrual */}
      <div>
        <h4 className="text-muted-foreground mb-3 text-sm font-medium">
          Quota & Accrual
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="annualQuota">Annual Quota (days) *</Label>
            <Input
              id="annualQuota"
              type="number"
              value={formData.annualQuota}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  annualQuota: Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accrualRatePerMonth">
              Accrual Rate (per month)
            </Label>
            <Input
              id="accrualRatePerMonth"
              type="number"
              step="0.1"
              value={formData.accrualRatePerMonth}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  accrualRatePerMonth: Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Carry Forward */}
      <div>
        <h4 className="text-muted-foreground mb-3 text-sm font-medium">
          Carry Forward
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="carryForwardLimit">
              Carry Forward Limit (days)
            </Label>
            <Input
              id="carryForwardLimit"
              type="number"
              value={formData.carryForwardLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  carryForwardLimit: Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carryForwardExpiryMonths">
              Carry Forward Expiry (months)
            </Label>
            <Input
              id="carryForwardExpiryMonths"
              type="number"
              value={formData.carryForwardExpiryMonths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  carryForwardExpiryMonths: Number.parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Request Rules */}
      <div>
        <h4 className="text-muted-foreground mb-3 text-sm font-medium">
          Request Rules
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="minDaysPerRequest">Min Days per Request</Label>
            <Input
              id="minDaysPerRequest"
              type="number"
              step="0.5"
              value={formData.minDaysPerRequest}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minDaysPerRequest: Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDaysPerRequest">Max Days per Request</Label>
            <Input
              id="maxDaysPerRequest"
              type="number"
              value={formData.maxDaysPerRequest}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxDaysPerRequest: Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advanceNoticeDays">Advance Notice (days)</Label>
            <Input
              id="advanceNoticeDays"
              type="number"
              value={formData.advanceNoticeDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  advanceNoticeDays: Number.parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Options */}
      <div>
        <h4 className="text-muted-foreground mb-3 text-sm font-medium">
          Options
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allowHalfDay">Allow Half-Day Leave</Label>
            <Switch
              id="allowHalfDay"
              checked={formData.allowHalfDay}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowHalfDay: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isPaid">Paid Leave</Label>
            <Switch
              id="isPaid"
              checked={formData.isPaid}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPaid: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="requiresAttachment">Requires Attachment</Label>
            <Switch
              id="requiresAttachment"
              checked={formData.requiresAttachment}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requiresAttachment: checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
