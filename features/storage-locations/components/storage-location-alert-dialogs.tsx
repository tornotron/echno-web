'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Delete Storage Location Dialog
// ---------------------------------------------------------------------------

interface DeleteStorageLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteStorageLocationDialog({
  open,
  onOpenChange,
  locationName,
  isPending,
  onConfirm,
}: DeleteStorageLocationDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {locationName}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete Location
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Save Storage Location Dialog
// ---------------------------------------------------------------------------

interface SaveStorageLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}

export function SaveStorageLocationDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: SaveStorageLocationDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save these changes? The location will be
            updated immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button disabled={isPending} onClick={onConfirm}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
