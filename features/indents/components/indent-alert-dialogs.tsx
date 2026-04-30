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
