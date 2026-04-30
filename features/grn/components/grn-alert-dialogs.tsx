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

interface DeleteGRNDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grnNumber: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteGRNDialog({
  open,
  onOpenChange,
  grnNumber,
  onConfirm,
  isPending,
}: DeleteGRNDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete GRN</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete GRN <strong>{grnNumber}</strong>?
            Stock that was recorded via this GRN will need to be adjusted
            manually. This action cannot be undone.
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
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
