'use client';

import { useState } from 'react';
import {
  CalendarClock,
  ClipboardCheck,
  History,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import type { WbsActivity } from '@tornotron/echno-core/wbs/types';
import {
  useDeleteWbsActivity,
  useWbsSchedule,
} from '@tornotron/echno-core/wbs/hooks';
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
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { useCan } from '@/hooks/use-can';
import { useEnabledModuleIds } from '@/hooks/use-enabled-module-ids';
import { toast } from '@/lib/styles/toast-styles';
import {
  PROGRESS_RECORD_ACCESS,
  SCHEDULE_WRITE_ACCESS,
} from '@/nav/access/roles';
import { STATUS_LABELS } from '../lib/labels';
import { canTakeProgress, delayLabel, summarize } from '../lib/schedule';
import { ActivityFormDialog } from './ActivityFormDialog';
import { DependenciesDialog } from './DependenciesDialog';
import { ProgressHistoryDialog } from './ProgressHistoryDialog';
import { RecordProgressDialog } from './RecordProgressDialog';

/** The Work Progress module's id, as `/modules/web/enabled` names it. */
export const WORK_PROGRESS_MODULE_ID = 'work-progress';

type Dialog =
  | { kind: 'add' }
  | {
      kind: 'edit' | 'links' | 'record' | 'history' | 'delete';
      activity: WbsActivity;
    };

interface ProjectScheduleViewProps {
  projectId: number;
}

function range(start?: string, end?: string): string {
  if (!start && !end) return 'Not set';
  if (start === end) return start as string;
  return `${start ?? '?'} to ${end ?? '?'}`;
}

/**
 * The project's schedule on the WBS tab: every activity with its planned,
 * actual and revised dates, progress, delay and what it depends on. The
 * schedule roles add, edit, link and delete activities; the project team
 * records progress inspections when the Work Progress module is enabled.
 * Nothing here moves a planned date.
 */
export function ProjectScheduleView({ projectId }: ProjectScheduleViewProps) {
  const { data, isPending, isError, error } = useWbsSchedule(projectId);
  const { allowed: canManage } = useCan(SCHEDULE_WRITE_ACCESS);
  const { allowed: canRecordRole } = useCan(PROGRESS_RECORD_ACCESS);
  const { moduleIds } = useEnabledModuleIds();
  const moduleOn = moduleIds?.has(WORK_PROGRESS_MODULE_ID) ?? false;
  const canRecord = moduleOn && canRecordRole;
  const deleteActivity = useDeleteWbsActivity();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  if (isPending) {
    return (
      <div className="space-y-3" data-testid="schedule-loading">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <CalendarClock className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Could not load the schedule</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const activities = data?.activities ?? [];
  const dependencies = data?.dependencies ?? [];
  const summary = summarize(activities);
  const predecessorsOf = (id: number) =>
    dependencies
      .filter((d) => d.successorId === id)
      .map((d) => d.predecessorWbsCode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Schedule activities
          </h3>
          <p className="text-muted-foreground text-sm">
            Planned dates are the agreed dates. A delay shows as a revised
            finish; nothing is rescheduled automatically.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialog({ kind: 'add' })}>
            <Plus className="size-4" />
            Add activity
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock className="size-6" />
            </EmptyMedia>
            <EmptyTitle>
              No activities in this project&apos;s schedule yet
            </EmptyTitle>
            <EmptyDescription>
              {canManage
                ? 'Add the activities with their planned start and finish to start tracking progress against them.'
                : 'A project manager adds the activities with their planned dates.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Activities', value: summary.activities },
              { label: 'Completed', value: summary.completed },
              { label: 'Delayed', value: summary.delayed },
              { label: 'Milestones', value: summary.milestones },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pt-3 pb-1">
                  <CardTitle className="text-muted-foreground text-xs font-medium">
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <span
                    className="text-2xl font-bold"
                    data-testid={`summary-${s.label.toLowerCase()}`}
                  >
                    {s.value}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Revised finish</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Depends on</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => {
                  const delay = delayLabel(a.delayDays);
                  const preds = predecessorsOf(a.id);
                  return (
                    <TableRow key={a.id} data-testid={`activity-${a.wbsCode}`}>
                      <TableCell>
                        <div style={{ paddingLeft: `${a.level * 1.25}rem` }}>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-mono text-xs">
                              {a.wbsCode}
                            </span>
                            <span className={a.isLeaf ? '' : 'font-semibold'}>
                              {a.title}
                            </span>
                            {a.isMilestone && (
                              <Badge variant="outline">Milestone</Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {STATUS_LABELS[a.status]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.responsibleEmployeeName ||
                        a.responsibleSubContractorName ? (
                          <>
                            {a.responsibleEmployeeName && (
                              <div>{a.responsibleEmployeeName}</div>
                            )}
                            {a.responsibleSubContractorName && (
                              <div className="text-muted-foreground">
                                {a.responsibleSubContractorName}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {range(a.startDate, a.endDate)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {a.actualStartDate || a.actualEndDate
                          ? range(a.actualStartDate, a.actualEndDate)
                          : 'Not started'}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {a.forecastEndDate ?? ''}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {Math.round(a.progress)}%
                      </TableCell>
                      <TableCell>
                        {delay && (
                          <Badge
                            variant={
                              (a.delayDays ?? 0) > 0
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {delay}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {preds.join(', ')}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {canRecord && canTakeProgress(a) && (
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Record progress for ${a.wbsCode}`}
                            onClick={() =>
                              setDialog({ kind: 'record', activity: a })
                            }
                          >
                            <ClipboardCheck className="size-4" />
                            Record
                          </Button>
                        )}
                        {moduleOn && a.isLeaf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Progress history for ${a.wbsCode}`}
                            onClick={() =>
                              setDialog({ kind: 'history', activity: a })
                            }
                          >
                            <History className="size-4" />
                          </Button>
                        )}
                        {canManage && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Edit ${a.wbsCode}`}
                              onClick={() =>
                                setDialog({ kind: 'edit', activity: a })
                              }
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Links for ${a.wbsCode}`}
                              onClick={() =>
                                setDialog({ kind: 'links', activity: a })
                              }
                            >
                              <Link2 className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Delete ${a.wbsCode}`}
                              onClick={() =>
                                setDialog({ kind: 'delete', activity: a })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {dialog?.kind === 'add' && (
        <ActivityFormDialog
          projectId={projectId}
          activities={activities}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'edit' && (
        <ActivityFormDialog
          key={dialog.activity.id}
          projectId={projectId}
          activities={activities}
          activity={dialog.activity}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'links' && (
        <DependenciesDialog
          projectId={projectId}
          activity={dialog.activity}
          activities={activities}
          dependencies={dependencies}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'record' && (
        <RecordProgressDialog
          key={dialog.activity.id}
          activity={dialog.activity}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'history' && (
        <ProgressHistoryDialog
          projectId={projectId}
          activity={dialog.activity}
          open
          onOpenChange={close}
        />
      )}
      <AlertDialog open={dialog?.kind === 'delete'} onOpenChange={close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.kind === 'delete'
                ? `Delete ${dialog.activity.wbsCode} ${dialog.activity.title} and everything under it? An activity with progress inspections recorded cannot be deleted.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteActivity.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteActivity.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (dialog?.kind !== 'delete') return;
                const target = dialog.activity;
                deleteActivity.mutate(
                  { projectId, elementId: target.id },
                  {
                    onSuccess: () => {
                      toast.success(`Activity ${target.wbsCode} deleted`);
                      setDialog(null);
                    },
                    onError: (err) =>
                      toast.error(
                        getErrorTitle(err, 'Could not delete the activity'),
                        {
                          description: getErrorMessage(err),
                        }
                      ),
                  }
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
