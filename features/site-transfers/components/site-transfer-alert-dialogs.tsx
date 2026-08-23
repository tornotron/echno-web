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

interface SiteTransferConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Reusable confirmation dialog for site-transfer actions (for example marking a
 * transfer received or cancelling it). The title, description, and button
 * styling are supplied by the caller so one dialog covers several prompts.
 *
 * @param props.open - Whether the dialog is visible.
 * @param props.onOpenChange - Called when the dialog requests open/close.
 * @param props.title - Heading text for the prompt.
 * @param props.description - Body text explaining the action.
 * @param props.variant - `destructive` styles the confirm button as a warning
 *   (default `default`).
 * @param props.onConfirm - Runs the action when the user confirms.
 * @param props.isPending - True while the action is in flight.
 */
export function SiteTransferConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  onConfirm,
  isPending,
}: SiteTransferConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
