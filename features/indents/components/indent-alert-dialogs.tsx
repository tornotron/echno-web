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
} from '@/components/shadcn/alert-dialog';
import { Loader2 } from 'lucide-react';

interface DeleteIndentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indentNumber: string;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Confirmation dialog for deleting an indent (material request). Shows the
 * indent number and warns the action cannot be undone; the confirm button
 * shows a spinner while `isPending`.
 *
 * @param props.open - Whether the dialog is visible.
 * @param props.onOpenChange - Called when the dialog requests open/close.
 * @param props.indentNumber - Indent number shown in the confirmation copy.
 * @param props.onConfirm - Runs the delete when the user confirms.
 * @param props.isPending - True while the delete request is in flight.
 */
export function DeleteIndentDialog({
  open,
  onOpenChange,
  indentNumber,
  onConfirm,
  isPending,
}: DeleteIndentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Indent</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete indent{' '}
            <strong>{indentNumber}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
