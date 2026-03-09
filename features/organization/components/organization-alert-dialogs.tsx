'use client';

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
import { Loader2 } from 'lucide-react';

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface SaveOrganizationDialogProps extends BaseDialogProps {
  organizationName: string;
  isPending: boolean;
}

export function RemoveOrgLogoDialog({
  open,
  onOpenChange,
  onConfirm,
}: BaseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Logo</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove the organization logo? This will
            permanently delete the file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            onClick={onConfirm}
          >
            Remove Logo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SaveOrganizationDialog({
  open,
  onOpenChange,
  onConfirm,
  organizationName,
  isPending,
}: SaveOrganizationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to update{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {organizationName}
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
