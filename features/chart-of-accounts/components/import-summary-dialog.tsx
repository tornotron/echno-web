'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import {
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { CoaImportSummary } from '@tornotron/echno-core/finance/types';

interface ImportSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CoaImportSummary | null;
}

export function ImportSummaryDialog({
  open,
  onOpenChange,
  summary,
}: ImportSummaryDialogProps) {
  const hasErrors = (summary?.errors.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            Import complete
          </DialogTitle>
          <DialogDescription>
            The chart-of-accounts CSV has been processed.
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <PlusCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {summary.created}
                  </p>
                  <p className="text-muted-foreground text-xs">created</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {summary.updated}
                  </p>
                  <p className="text-muted-foreground text-xs">updated</p>
                </div>
              </div>
            </div>

            {hasErrors && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {summary.errors.length} row
                  {summary.errors.length === 1 ? '' : 's'} skipped
                </p>
                <ul className="bg-muted/40 max-h-48 space-y-1 overflow-y-auto rounded-md border p-3 text-sm">
                  {summary.errors.map((error, index) => (
                    <li
                      key={index}
                      className="text-amber-700 dark:text-amber-400"
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
