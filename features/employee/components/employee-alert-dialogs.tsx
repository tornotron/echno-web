'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/types/employee';
import { OrgRole, getOrgRoleLabel } from '@/types/employee/org-role';

// ---------------------------------------------------------------------------
// Assign / Change Manager Dialog
// ---------------------------------------------------------------------------

interface AssignManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managers: Employee[];
  managersLoading: boolean;
  currentEmployeeId: number;
  defaultManagerId?: number;
  isPending: boolean;
  onConfirm: (managerId: number) => void;
}

export function AssignManagerDialog({
  open,
  onOpenChange,
  managers,
  managersLoading,
  currentEmployeeId,
  defaultManagerId,
  isPending,
  onConfirm,
}: AssignManagerDialogProps) {
  const [selectedManagerId, setSelectedManagerId] = useState(
    defaultManagerId?.toString() ?? ''
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedManagerId(defaultManagerId?.toString() ?? '');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Manager</DialogTitle>
          <DialogDescription>
            Select a reporting manager for this employee.
          </DialogDescription>
        </DialogHeader>

        <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                managersLoading ? 'Loading managers...' : 'Select a manager'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {managers.length === 0 && !managersLoading && (
              <SelectItem value="none" disabled>
                No managers available
              </SelectItem>
            )}
            {managers.map((manager) => (
              <SelectItem
                key={manager.id}
                value={manager.id?.toString() ?? ''}
                disabled={manager.id === currentEmployeeId}
              >
                {manager.name} — {manager.designation}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedManagerId || isPending}
            onClick={() => {
              const id = Number.parseInt(selectedManagerId, 10);
              if (!Number.isNaN(id)) onConfirm(id);
            }}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Assign Role Dialog
// ---------------------------------------------------------------------------

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRoles: string[];
  isPending: boolean;
  onConfirm: (role: OrgRole) => void;
}

export function AssignRoleDialog({
  open,
  onOpenChange,
  availableRoles,
  isPending,
  onConfirm,
}: AssignRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedRole('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Select a role to assign to this employee.
          </DialogDescription>
        </DialogHeader>

        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role to assign" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {getOrgRoleLabel(role as OrgRole)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedRole || isPending}
            onClick={() => {
              if (selectedRole) onConfirm(selectedRole as OrgRole);
            }}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Save Employee Dialog
// ---------------------------------------------------------------------------

interface SaveEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function SaveEmployeeDialog({
  open,
  onOpenChange,
  employeeName,
  isPending,
  onConfirm,
}: SaveEmployeeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to update{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {employeeName}
            </span>
            ? The changes will be saved immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onConfirm}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Remove Role Dialog
// ---------------------------------------------------------------------------

interface RemoveRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  employeeName: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function RemoveRoleDialog({
  open,
  onOpenChange,
  roleName,
  employeeName,
  isPending,
  onConfirm,
}: RemoveRoleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove the{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {roleName}
            </span>{' '}
            role from {employeeName}? This will immediately affect their access
            and permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Remove Role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
