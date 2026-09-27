'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import type { WbsActivity } from '@tornotron/echno-core/wbs/types';
import {
  DelayReason,
  ProgressOutcome,
  type RecordProgressInspectionRequest,
} from '@tornotron/echno-core/work-progress/types';
import { useRecordProgressInspection } from '@tornotron/echno-core/work-progress/hooks';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import { uploadProgressEvidence } from '../lib/evidence';
import { SELECT_CLASS } from '../lib/form-styles';
import { DELAY_REASON_LABELS, OUTCOME_LABELS } from '../lib/labels';
import { isLateAt, todayAtSites } from '../lib/schedule';

interface RecordProgressDialogProps {
  activity: WbsActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Records what a progress inspection found for one activity: done, partly
 * done or not done on the date, with the actual dates, a revised finish and
 * the reason for a delay. The record is final once saved and the backend
 * applies it to the activity; planned dates never move. Evidence files are
 * uploaded to the record once it exists.
 */
export function RecordProgressDialog({
  activity,
  open,
  onOpenChange,
}: RecordProgressDialogProps) {
  const record = useRecordProgressInspection();
  const today = todayAtSites();
  const outcomes = activity.isMilestone
    ? [ProgressOutcome.DONE, ProgressOutcome.NOT_DONE]
    : [ProgressOutcome.DONE, ProgressOutcome.PARTIAL, ProgressOutcome.NOT_DONE];

  const [outcome, setOutcome] = useState<ProgressOutcome>(ProgressOutcome.DONE);
  const [inspectionDate, setInspectionDate] = useState(today);
  const [percent, setPercent] = useState('');
  const [actualStart, setActualStart] = useState('');
  const [actualFinish, setActualFinish] = useState('');
  const [forecast, setForecast] = useState('');
  const [reason, setReason] = useState<DelayReason | ''>('');
  const [notes, setNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const done = outcome === ProgressOutcome.DONE;
  const partial = outcome === ProgressOutcome.PARTIAL;
  const notDone = outcome === ProgressOutcome.NOT_DONE;
  const needsStart = !notDone && !activity.actualStartDate;
  const late = useMemo(
    () =>
      isLateAt(
        activity.endDate,
        outcome,
        inspectionDate,
        actualFinish || undefined,
        forecast || undefined
      ),
    [activity.endDate, outcome, inspectionDate, actualFinish, forecast]
  );

  const submit = async () => {
    const req: RecordProgressInspectionRequest = {
      wbsElementId: activity.id,
      inspectionDate,
      outcome,
    };
    if (partial && percent !== '') req.percentComplete = Number(percent);
    if (needsStart && actualStart) req.actualStartDate = actualStart;
    if (done && actualFinish) req.actualFinishDate = actualFinish;
    if (!done && forecast) req.forecastFinishDate = forecast;
    if (reason) req.delayReason = reason;
    if (notes.trim()) req.delayNotes = notes.trim();
    if (remarks.trim()) req.remarks = remarks.trim();

    setSaving(true);
    try {
      const saved = await record.mutateAsync(req);
      if (files.length > 0 && saved) {
        const { errors } = await uploadProgressEvidence(saved.id, files);
        if (errors.length > 0) {
          toast.error('Progress recorded, but some evidence did not upload', {
            description: errors
              .map((e) => `${e.filename}: ${e.message}`)
              .join('; '),
          });
        }
      }
      toast.success(`Progress recorded for ${activity.wbsCode}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorTitle(error, 'Could not record progress'), {
        description: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record progress</DialogTitle>
          <DialogDescription>
            {activity.wbsCode} {activity.title}
            {activity.endDate ? `, planned finish ${activity.endDate}` : ''}. A
            saved record cannot be edited.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">What was found</legend>
            <div className="flex flex-wrap gap-4">
              {outcomes.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="outcome"
                    value={value}
                    checked={outcome === value}
                    onChange={() => setOutcome(value)}
                  />
                  {OUTCOME_LABELS[value]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wpi-date">Inspection date</Label>
              <Input
                id="wpi-date"
                type="date"
                max={today}
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
              />
            </div>
            {partial && (
              <div className="space-y-1.5">
                <Label htmlFor="wpi-percent">Percent complete</Label>
                <Input
                  id="wpi-percent"
                  type="number"
                  min={1}
                  max={99}
                  step="0.01"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  required
                />
              </div>
            )}
            {needsStart && (
              <div className="space-y-1.5">
                <Label htmlFor="wpi-start">Actual start</Label>
                <Input
                  id="wpi-start"
                  type="date"
                  max={inspectionDate}
                  value={actualStart}
                  onChange={(e) => setActualStart(e.target.value)}
                  required
                />
              </div>
            )}
            {done && (
              <div className="space-y-1.5">
                <Label htmlFor="wpi-finish">Actual finish</Label>
                <Input
                  id="wpi-finish"
                  type="date"
                  max={inspectionDate}
                  value={actualFinish}
                  onChange={(e) => setActualFinish(e.target.value)}
                  required
                />
              </div>
            )}
            {!done && (
              <div className="space-y-1.5">
                <Label htmlFor="wpi-forecast">Revised finish (forecast)</Label>
                <Input
                  id="wpi-forecast"
                  type="date"
                  min={inspectionDate}
                  value={forecast}
                  onChange={(e) => setForecast(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wpi-reason">
              Reason for delay{late ? ' (required, the activity is late)' : ''}
            </Label>
            <select
              id="wpi-reason"
              className={SELECT_CLASS}
              value={reason}
              required={late}
              onChange={(e) => setReason(e.target.value as DelayReason | '')}
            >
              <option value="">{late ? 'Select a reason' : 'No delay'}</option>
              {Object.values(DelayReason).map((value) => (
                <option key={value} value={value}>
                  {DELAY_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {reason && (
            <div className="space-y-1.5">
              <Label htmlFor="wpi-notes">
                Delay notes{reason === DelayReason.OTHER ? ' (required)' : ''}
              </Label>
              <Textarea
                id="wpi-notes"
                value={notes}
                required={reason === DelayReason.OTHER}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="wpi-remarks">Remarks</Label>
            <Textarea
              id="wpi-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={4000}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wpi-evidence">
              Evidence (photos, measurement sheets)
            </Label>
            <Input
              id="wpi-evidence"
              type="file"
              multiple
              onChange={(e) =>
                setFiles(e.target.files ? [...e.target.files] : [])
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
