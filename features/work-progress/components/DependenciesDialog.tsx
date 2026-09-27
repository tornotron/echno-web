'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  WbsDependencyType,
  type WbsActivity,
  type WbsDependency,
} from '@tornotron/echno-core/wbs/types';
import {
  useAddWbsDependency,
  useRemoveWbsDependency,
} from '@tornotron/echno-core/wbs/hooks';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { toast } from '@/lib/styles/toast-styles';
import { SELECT_CLASS } from '../lib/form-styles';
import { DEPENDENCY_TYPE_LABELS } from '../lib/labels';

const onError = (fallback: string) => (error: unknown) =>
  toast.error(getErrorTitle(error, fallback), {
    description: getErrorMessage(error),
  });

interface DependenciesDialogProps {
  projectId: number;
  activity: WbsActivity;
  activities: WbsActivity[];
  dependencies: WbsDependency[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The activities one activity depends on. Links are information only: no
 * date moves when one is added, and a loop is refused by the server.
 */
export function DependenciesDialog({
  projectId,
  activity,
  activities,
  dependencies,
  open,
  onOpenChange,
}: DependenciesDialogProps) {
  const add = useAddWbsDependency();
  const remove = useRemoveWbsDependency();
  const [predecessorId, setPredecessorId] = useState('');
  const [type, setType] = useState<WbsDependencyType>(WbsDependencyType.FS);
  const [lag, setLag] = useState('0');

  const predecessors = dependencies.filter(
    (d) => d.successorId === activity.id
  );
  const linked = new Set(predecessors.map((d) => d.predecessorId));
  const candidates = activities.filter(
    (a) => a.id !== activity.id && !linked.has(a.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Depends on</DialogTitle>
          <DialogDescription>
            {activity.wbsCode} {activity.title}. Links are shown on the
            schedule; they do not move any date.
          </DialogDescription>
        </DialogHeader>

        {predecessors.length > 0 ? (
          <ul className="space-y-2">
            {predecessors.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {d.predecessorWbsCode}: {DEPENDENCY_TYPE_LABELS[d.type]}
                  {d.lagDays === 0 ? '' : `, lag ${d.lagDays} day(s)`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove link to ${d.predecessorWbsCode}`}
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(
                      { projectId, dependencyId: d.id },
                      { onError: onError('Could not remove the link') }
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            This activity depends on no other activity.
          </p>
        )}

        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!predecessorId) return;
            add.mutate(
              {
                projectId,
                data: {
                  predecessorId: Number(predecessorId),
                  successorId: activity.id,
                  type,
                  lagDays: Number(lag) || 0,
                },
              },
              {
                onSuccess: () => {
                  setPredecessorId('');
                  setLag('0');
                },
                onError: onError('Could not add the link'),
              }
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="dep-predecessor">Activity it depends on</Label>
            <select
              id="dep-predecessor"
              className={SELECT_CLASS}
              value={predecessorId}
              onChange={(e) => setPredecessorId(e.target.value)}
            >
              <option value="">Select an activity</option>
              {candidates.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.wbsCode} {a.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dep-type">How</Label>
            <select
              id="dep-type"
              className={SELECT_CLASS}
              value={type}
              onChange={(e) => setType(e.target.value as WbsDependencyType)}
            >
              {Object.values(WbsDependencyType).map((value) => (
                <option key={value} value={value}>
                  {DEPENDENCY_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dep-lag">Lag (days)</Label>
            <Input
              id="dep-lag"
              type="number"
              min={-365}
              max={365}
              value={lag}
              onChange={(e) => setLag(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!predecessorId || add.isPending}>
            Add link
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
