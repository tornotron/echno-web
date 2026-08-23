'use client';

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';

interface DeletePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poNumber: string;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Confirmation dialog for deleting a purchase order. Shows the PO number and
 * warns that the action cannot be undone; the confirm button is disabled and
 * shows a spinner while `isPending`.
 *
 * @param props.open - Whether the dialog is visible.
 * @param props.onOpenChange - Called when the dialog requests open/close.
 * @param props.poNumber - PO number shown in the confirmation copy.
 * @param props.onConfirm - Runs the delete when the user confirms.
 * @param props.isPending - True while the delete request is in flight.
 */
export function DeletePODialog({
  open,
  onOpenChange,
  poNumber,
  onConfirm,
  isPending,
}: DeletePODialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete purchase order{' '}
            <strong>{poNumber}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
