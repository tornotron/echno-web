'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAdjustBalance } from '@/hooks/leave/use-leave-mutations';
import { LeaveBalance } from '@/types/leave';
import { toast } from '@/lib/styles/toast-styles';

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  adjustedById: number;
  balances: LeaveBalance[];
}

export function BalanceAdjustmentDialog({
  open,
  onOpenChange,
  employeeId,
  adjustedById,
  balances,
}: BalanceAdjustmentDialogProps) {
  const adjustMutation = useAdjustBalance();
  const [leavePolicyId, setLeavePolicyId] = useState<string>('');
  const [days, setDays] = useState<string>('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!leavePolicyId) {
      toast.error('Validation Error', {
        description: 'Please select a leave policy',
      });
      return;
    }
    if (!days || Number(days) === 0) {
      toast.error('Validation Error', {
        description: 'Please enter a non-zero number of days',
      });
      return;
    }
    if (!reason.trim()) {
      toast.error('Validation Error', {
        description: 'Please provide a reason for the adjustment',
      });
      return;
    }

    adjustMutation.mutate(
      {
        employeeId,
        leavePolicyId: Number(leavePolicyId),
        days: Number(days),
        reason: reason.trim(),
        adjustedById,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const resetForm = () => {
    setLeavePolicyId('');
    setDays('');
    setReason('');
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Leave Balance</DialogTitle>
          <DialogDescription>
            Manually adjust an employee&apos;s leave balance. Use positive
            values to credit and negative values to debit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="leavePolicy">Leave Policy *</Label>
            <Select value={leavePolicyId} onValueChange={setLeavePolicyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((balance) => (
                  <SelectItem
                    key={balance.leavePolicyId}
                    value={balance.leavePolicyId.toString()}
                  >
                    {balance.leaveTypeName} (Available:{' '}
                    {balance.availableBalance.toFixed(1)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Days *</Label>
            <Input
              id="days"
              type="number"
              step="0.5"
              placeholder="e.g. 2 for credit, -1 for debit"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Positive = credit, Negative = debit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Provide a reason for this adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={adjustMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              adjustMutation.isPending ||
              !reason.trim() ||
              !days ||
              !leavePolicyId
            }
          >
            {adjustMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Adjust Balance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
