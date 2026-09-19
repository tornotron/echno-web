'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { EmployeeStatus } from '@tornotron/echno-core/employee/types';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import {
  useCreateToolboxTalk,
  useUpdateToolboxTalk,
} from '@tornotron/echno-core/toolbox-talks/hooks';
import type { ToolboxTalk } from '@tornotron/echno-core/toolbox-talks/types';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { SpatialLocationPicker } from '@/components/shared/spatial-location-picker';
import { fromTalkTime, todayIsoDate, toTalkTime } from '../lib/labels';

const SELECT_CLASS =
  'border-input bg-background h-9 w-full rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

export const TOOLBOX_TALK_FORM_ID = 'toolbox-talk-form';

interface ToolboxTalksFormProps {
  /** A talk to edit; absent for a new draft. Only a draft is editable. */
  talk?: ToolboxTalk;
  onSaved: (talk: ToolboxTalk) => void;
  onCancel: () => void;
}

/**
 * The draft form. On create it also takes the first attendance; on edit the
 * attendance lives on the detail page, since the backend keeps it as its own
 * operations (add a batch, remove one) rather than part of the update.
 */
export function ToolboxTalksForm({
  talk,
  onSaved,
  onCancel,
}: ToolboxTalksFormProps) {
  const editing = Boolean(talk);
  const [projectId, setProjectId] = useState(
    talk ? String(talk.projectId) : ''
  );
  const [spatialNodeId, setSpatialNodeId] = useState<string | undefined>(
    talk?.spatialNodeId
  );
  const [topic, setTopic] = useState(talk?.topic ?? '');
  const [talkDate, setTalkDate] = useState(talk?.talkDate || todayIsoDate());
  const [talkTime, setTalkTime] = useState(fromTalkTime(talk?.talkTime));
  const [conductorId, setConductorId] = useState(
    talk ? String(talk.conductorEmployeeId) : ''
  );
  const [notes, setNotes] = useState(talk?.notes ?? '');
  const [attendees, setAttendees] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const active = useMemo(
    () =>
      employees.filter((employee) => employee.status === EmployeeStatus.active),
    [employees]
  );
  const conductorIsActive = active.some(
    (employee) => String(employee.id) === conductorId
  );
  /** The talk's original conductor, when they have since gone inactive: the
   * select only lists active employees, so this id has no matching option
   * and the form must be re-picked rather than silently resubmit it. */
  const staleConductorName = useMemo(() => {
    if (!talk || conductorIsActive) return;
    const original = String(talk.conductorEmployeeId);
    return (
      employees.find((employee) => String(employee.id) === original)?.name ??
      `Employee #${talk.conductorEmployeeId}`
    );
  }, [talk, conductorIsActive, employees]);
  const crew = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle
      ? active.filter((employee) =>
          employee.name.toLowerCase().includes(needle)
        )
      : active;
  }, [active, search]);

  const create = useCreateToolboxTalk();
  const update = useUpdateToolboxTalk();
  const pending = create.isPending || update.isPending;
  const failure = create.isError
    ? create.error
    : update.isError
      ? update.error
      : null;
  const valid =
    topic.trim() !== '' &&
    talkDate !== '' &&
    conductorIsActive &&
    projectId !== '';

  const toggleAttendee = (id: number, checked: boolean) => {
    setAttendees((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const common = {
      topic: topic.trim(),
      talkDate,
      conductorEmployeeId: Number(conductorId),
      spatialNodeId: spatialNodeId || undefined,
      talkTime: toTalkTime(talkTime),
      notes: notes.trim() || undefined,
    };
    if (talk) {
      update.mutate({ id: talk.id, data: common }, { onSuccess: onSaved });
    } else {
      create.mutate(
        {
          projectId: Number(projectId),
          ...common,
          attendeeEmployeeIds: [...attendees],
        },
        { onSuccess: onSaved }
      );
    }
  };

  return (
    <form
      id={TOOLBOX_TALK_FORM_ID}
      onSubmit={submit}
      aria-label={editing ? 'Edit toolbox talk' : 'New toolbox talk'}
      className="flex flex-col gap-4 rounded-md border p-4"
      data-testid="toolbox-talks-form"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="toolbox-talk-project">Project</Label>
          <select
            id="toolbox-talk-project"
            className={SELECT_CLASS}
            value={projectId}
            disabled={editing}
            onChange={(event) => {
              setProjectId(event.target.value);
              setSpatialNodeId(undefined);
            }}
            required
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={String(project.id)}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="toolbox-talk-conductor">Conducted by</Label>
          <select
            id="toolbox-talk-conductor"
            className={SELECT_CLASS}
            value={conductorId}
            onChange={(event) => setConductorId(event.target.value)}
            required
          >
            <option value="">Select an employee</option>
            {active.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>
                {employee.name}
                {employee.designation ? ` (${employee.designation})` : ''}
              </option>
            ))}
          </select>
          {staleConductorName && (
            <p role="alert" className="text-destructive text-sm">
              {staleConductorName} is no longer an active employee. Pick a
              replacement conductor.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Location</Label>
        <SpatialLocationPicker
          projectId={projectId ? Number(projectId) : undefined}
          value={spatialNodeId}
          onChange={setSpatialNodeId}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="toolbox-talk-topic">Topic</Label>
        <Input
          id="toolbox-talk-topic"
          value={topic}
          maxLength={200}
          onChange={(event) => setTopic(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="toolbox-talk-date">Date</Label>
          <Input
            id="toolbox-talk-date"
            type="date"
            value={talkDate}
            onChange={(event) => setTalkDate(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="toolbox-talk-time">Time</Label>
          <Input
            id="toolbox-talk-time"
            type="time"
            value={talkTime}
            onChange={(event) => setTalkTime(event.target.value)}
          />
        </div>
      </div>

      {!editing && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Attendees{attendees.size > 0 ? ` (${attendees.size})` : ''}
          </legend>
          <Input
            aria-label="Search employees"
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-56 overflow-y-auto rounded-md border">
            {crew.length === 0 && (
              <p className="text-muted-foreground p-3 text-sm">
                No active employees match.
              </p>
            )}
            {crew.map((employee) => (
              <label
                key={employee.id}
                className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0"
              >
                <Checkbox
                  checked={attendees.has(employee.id)}
                  onCheckedChange={(checked) =>
                    toggleAttendee(employee.id, checked === true)
                  }
                  aria-label={`Attendee ${employee.name}`}
                />
                <span>{employee.name}</span>
                {employee.designation && (
                  <span className="text-muted-foreground">
                    {employee.designation}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="toolbox-talk-notes">Notes</Label>
        <Textarea
          id="toolbox-talk-notes"
          value={notes}
          maxLength={4000}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {failure && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(failure)}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !valid}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {editing ? 'Save changes' : 'Save draft'}
        </Button>
      </div>
    </form>
  );
}
