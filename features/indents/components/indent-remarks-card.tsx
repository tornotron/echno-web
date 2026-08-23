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
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { useUpdateIndent } from '@tornotron/echno-core/indents/hooks';
import { toast } from '@/lib/styles/toast-styles';
import type { Indent } from '@tornotron/echno-core/indents/types';

interface IndentRemarksCardProps {
  indent: Indent;
}

/**
 * Card showing an indent's remarks with inline editing. Editing reveals a
 * textarea and saves the new text through the update-indent mutation, surfacing
 * success or failure as a toast.
 *
 * @param props.indent - The indent whose remarks are shown and edited.
 */
export function IndentRemarksCard({ indent }: IndentRemarksCardProps) {
  const { mutateAsync: updateIndent, isPending: isUpdating } =
    useUpdateIndent();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevIndent, setPrevIndent] = useState(indent);
  const [remarksText, setRemarksText] = useState(indent.remarks ?? '');

  if (prevIndent !== indent) {
    setPrevIndent(indent);
    setRemarksText(indent.remarks ?? '');
  }

  async function handleConfirmSave() {
    try {
      await updateIndent({
        id: indent.id,
        dto: {
          indentNumber: indent.indentNumber,
          status: indent.status,
          expectedOn: indent.expectedOn
            ? new Date(indent.expectedOn).toISOString()
            : undefined,
          projectId: indent.projectId,
          remarks: remarksText.trim() || undefined,
        },
      });
      setIsEditing(false);
      toast.success('Indent updated successfully.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update indent.'
      );
    }
  }

  return (
    <>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Remarks</AlertDialogTitle>
            <AlertDialogDescription>Save these changes?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  onClick={() => setShowConfirm(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setIsEditing(false);
                    setRemarksText(indent.remarks ?? '');
                  }}
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
          ) : indent.remarks ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {indent.remarks}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">No remarks</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
