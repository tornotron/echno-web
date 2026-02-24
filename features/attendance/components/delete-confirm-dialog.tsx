import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteTarget: {
    type: 'shift' | 'profile';
    id: number;
    name: string;
  } | null;
  confirmDelete: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  deleteTarget,
  confirmDelete,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Delete {deleteTarget?.type === 'shift' ? 'Shift' : 'Profile'}?
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{deleteTarget?.name}</span> will be
            permanently deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
