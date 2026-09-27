'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { EmployeeStatus } from '@tornotron/echno-core/employee/types';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import type {
  CreateWbsActivityRequest,
  UpdateWbsActivityRequest,
  WbsActivity,
} from '@tornotron/echno-core/wbs/types';
import {
  useCreateWbsActivity,
  useUpdateWbsActivity,
} from '@tornotron/echno-core/wbs/hooks';
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
import { useSubContracts } from '@/hooks/sub-contracts';
import { toast } from '@/lib/styles/toast-styles';
import { SELECT_CLASS } from '../lib/form-styles';
import { formatInr } from '../lib/money';

interface ActivityFormDialogProps {
  projectId: number;
  /** Every activity of the project, for the parent picker. */
  activities: WbsActivity[];
  /** The activity to edit; absent to add a new one. */
  activity?: WbsActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const numberOrUndefined = (value: string) =>
  value === '' ? undefined : Number(value);

/**
 * Adds or edits a schedule activity: its code and title, where it sits in
 * the WBS, the planned dates, whether it is a milestone, its weight and
 * budget, and who is responsible. On edit it also takes a revised finish;
 * the planned finish stays the agreed date a delay is measured against.
 */
export function ActivityFormDialog({
  projectId,
  activities,
  activity,
  open,
  onOpenChange,
}: ActivityFormDialogProps) {
  const editing = activity !== undefined;
  const create = useCreateWbsActivity();
  const update = useUpdateWbsActivity();
  const { data: employees = [] } = useEmployeeLookup();
  const { data: subContracts = [] } = useSubContracts();

  const [wbsCode, setWbsCode] = useState(activity?.wbsCode ?? '');
  const [title, setTitle] = useState(activity?.title ?? '');
  const [parentId, setParentId] = useState(
    activity?.parentId ? String(activity.parentId) : ''
  );
  const [startDate, setStartDate] = useState(activity?.startDate ?? '');
  const [endDate, setEndDate] = useState(activity?.endDate ?? '');
  const [forecastEndDate, setForecastEndDate] = useState(
    activity?.forecastEndDate ?? ''
  );
  const [isMilestone, setIsMilestone] = useState(
    activity?.isMilestone ?? false
  );
  const [weight, setWeight] = useState(activity ? String(activity.weight) : '');
  const [budget, setBudget] = useState(
    activity?.budgetedCost ? String(activity.budgetedCost) : ''
  );
  const [employeeId, setEmployeeId] = useState(
    activity?.responsibleEmployeeId
      ? String(activity.responsibleEmployeeId)
      : ''
  );
  const [subContractId, setSubContractId] = useState(
    activity?.responsibleSubContractId
      ? String(activity.responsibleSubContractId)
      : ''
  );

  const saving = create.isPending || update.isPending;
  const activeEmployees = employees.filter(
    (e) => e.status === EmployeeStatus.active
  );
  const projectContracts = subContracts.filter(
    (sc) => !sc.projectId || String(sc.projectId) === String(projectId)
  );
  // A parent cannot be the activity itself.
  const parents = activities.filter((a) => a.id !== activity?.id);

  const submit = () => {
    const onError = (error: unknown) =>
      toast.error(
        getErrorTitle(
          error,
          editing ? 'Could not save the activity' : 'Could not add the activity'
        ),
        { description: getErrorMessage(error) }
      );
    const onSuccess = () => {
      toast.success(
        editing ? `Activity ${wbsCode} saved` : `Activity ${wbsCode} added`
      );
      onOpenChange(false);
    };

    if (editing && activity) {
      const data: UpdateWbsActivityRequest = {
        title: title.trim(),
        isMilestone,
      };
      if (startDate) data.startDate = startDate;
      if (endDate) data.endDate = endDate;
      if (forecastEndDate) data.forecastEndDate = forecastEndDate;
      if (weight !== '') data.weight = Number(weight);
      if (budget !== '') data.budgetedCost = Number(budget);
      if (employeeId) data.responsibleEmployeeId = Number(employeeId);
      if (subContractId) data.responsibleSubContractId = Number(subContractId);
      update.mutate(
        { projectId, elementId: activity.id, data },
        { onSuccess, onError }
      );
      return;
    }

    const data: CreateWbsActivityRequest = {
      wbsCode: wbsCode.trim(),
      title: title.trim(),
      isMilestone,
      parentId: numberOrUndefined(parentId),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      weight: numberOrUndefined(weight),
      budgetedCost: numberOrUndefined(budget),
      responsibleEmployeeId: numberOrUndefined(employeeId),
      responsibleSubContractId: numberOrUndefined(subContractId),
    };
    create.mutate({ projectId, data }, { onSuccess, onError });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit activity ${activity?.wbsCode}` : 'Add activity'}
          </DialogTitle>
          <DialogDescription>
            Planned dates are the agreed dates. A delay is recorded as a revised
            finish and never moves them.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="act-code">WBS code</Label>
              <Input
                id="act-code"
                value={wbsCode}
                onChange={(e) => setWbsCode(e.target.value)}
                placeholder="1.2.3"
                maxLength={50}
                disabled={editing}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="act-title">Activity</Label>
              <Input
                id="act-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="RCC column casting, Block A"
                maxLength={255}
                required
              />
            </div>
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="act-parent">Under</Label>
              <select
                id="act-parent"
                className={SELECT_CLASS}
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">Top level</option>
                {parents.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.wbsCode} {a.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isMilestone}
              onChange={(e) => setIsMilestone(e.target.checked)}
            />
            Milestone (one date: planned start equals planned finish)
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {!isMilestone && (
              <div className="space-y-1.5">
                <Label htmlFor="act-start">Planned start</Label>
                <Input
                  id="act-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="act-end">
                {isMilestone ? 'Milestone date' : 'Planned finish'}
              </Label>
              <Input
                id="act-end"
                type="date"
                min={isMilestone ? undefined : startDate || undefined}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (isMilestone) setStartDate(e.target.value);
                }}
              />
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label htmlFor="act-forecast">Revised finish (forecast)</Label>
                <Input
                  id="act-forecast"
                  type="date"
                  value={forecastEndDate}
                  onChange={(e) => setForecastEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="act-weight">Weight</Label>
              <Input
                id="act-weight"
                type="number"
                min={0}
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-budget">Budgeted cost (INR)</Label>
              <Input
                id="act-budget"
                type="number"
                min={0}
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              {budget !== '' && (
                <p className="text-muted-foreground text-xs">
                  {formatInr(Number(budget))}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="act-employee">Responsible person</Label>
              <select
                id="act-employee"
                className={SELECT_CLASS}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Not assigned</option>
                {activeEmployees.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-contract">Sub-contractor</Label>
              <select
                id="act-contract"
                className={SELECT_CLASS}
                value={subContractId}
                onChange={(e) => setSubContractId(e.target.value)}
              >
                <option value="">None</option>
                {projectContracts.map((sc) => (
                  <option key={sc.id} value={String(sc.id)}>
                    {sc.contractorName} ({sc.contractName})
                  </option>
                ))}
              </select>
            </div>
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
              {editing ? 'Save' : 'Add activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
