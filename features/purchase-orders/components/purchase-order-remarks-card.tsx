'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
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
import { Loader2, Pencil, Check, X } from 'lucide-react';
import { useUpdatePurchaseOrder } from '@tornotron/echno-core/purchase-orders/hooks';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import type { PurchaseOrder } from '@tornotron/echno-core/purchase-orders/types';

interface PORemarksCardProps {
  po: PurchaseOrder;
}

/**
 * Card showing a purchase order's remarks with inline editing. Editing reveals
 * a textarea and saves the new text through the update-purchase-order mutation,
 * confirming first and surfacing success or failure as a toast.
 *
 * @param props.po - The purchase order whose remarks are shown and edited.
 */
export function PORemarksCard({ po }: PORemarksCardProps) {
  const { mutateAsync: updatePO, isPending } = useUpdatePurchaseOrder();

  const [isEditing, setIsEditing] = useState(false);
  const [prevRemarks, setPrevRemarks] = useState(po.remarks);
  const [remarksText, setRemarksText] = useState(po.remarks ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (prevRemarks !== po.remarks) {
    setPrevRemarks(po.remarks);
    setRemarksText(po.remarks ?? '');
  }

  async function handleConfirm() {
    try {
      await updatePO({
        id: po.id,
        remarks: remarksText.trim() || undefined,
      });
      setIsEditing(false);
      toast.success('Purchase Order Updated', {
        description: 'The purchase order has been updated successfully.',
      });
    } catch (error) {
      toast.error(getErrorTitle(error, 'Failed to Update Purchase Order'), {
        description: getErrorMessage(error),
      });
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setRemarksText(po.remarks ?? '');
  }

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Remarks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Remarks</CardTitle>
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleCancel}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              placeholder="Add remarks..."
              rows={4}
              className="resize-none"
            />
          ) : po.remarks ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {po.remarks}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">No remarks</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
