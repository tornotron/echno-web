'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Loader2 } from 'lucide-react';
import {
  useFinanceSettings,
  useUpdateFinanceSettings,
} from '@tornotron/echno-core/finance/hooks';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';

export function ApprovalThresholdPanel() {
  const { data: settings, isLoading, isError } = useFinanceSettings();
  const updateSettings = useUpdateFinanceSettings();

  const [value, setValue] = useState('');

  // Sync the input from the loaded settings; blank when the threshold is unset.
  useEffect(() => {
    if (settings) {
      setValue(
        settings.approvalThreshold === null
          ? ''
          : String(settings.approvalThreshold)
      );
    }
  }, [settings]);

  function handleSave() {
    const trimmed = value.trim();
    const approvalThreshold = trimmed === '' ? null : Number(trimmed);

    if (approvalThreshold !== null && !Number.isFinite(approvalThreshold)) {
      toast.error('Invalid amount', {
        description: 'Enter a valid number, or leave it blank.',
      });
      return;
    }
    if (approvalThreshold !== null && approvalThreshold < 0) {
      toast.error('Invalid amount', {
        description: 'The threshold cannot be negative.',
      });
      return;
    }

    updateSettings.mutate(
      { approvalThreshold },
      {
        onSuccess: () =>
          toast.success('Approval threshold saved', {
            description:
              approvalThreshold === null
                ? 'Every invoice now requires approval.'
                : `Invoices at or above ₹${approvalThreshold} require approval.`,
          }),
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Save failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Invoice approval</h2>
        <p className="text-muted-foreground text-sm">
          Invoices below this amount are auto-approved on submit; at or above
          it, an approver must approve. Leave blank to require approval on every
          invoice.
        </p>
      </div>

      {isLoading && <Skeleton className="h-9 w-full max-w-sm" />}

      {isError && (
        <p className="text-destructive text-sm">
          Failed to load finance settings. Please try again.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-2 sm:max-w-xs">
            <Label htmlFor="approval-threshold">Approval threshold (₹)</Label>
            <Input
              id="approval-threshold"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="No threshold (approve all)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="sm:mb-0.5"
          >
            {updateSettings.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </div>
      )}
    </Card>
  );
}
