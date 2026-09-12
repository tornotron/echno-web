'use client';

/**
 * The History tab: the append-only event log of an inspection or an NCR,
 * oldest first, one page at a time.
 *
 * Each event names the business step (`ncr.verified`, not "row updated"), who
 * took it, when, and the fields it changed as a before and an after keyed by
 * the DTO names the app already knows. The rendering is generic on purpose: a
 * new event type on the backend is a constant, never a migration, and the
 * timeline has to show one it has never seen.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { Bot, Cpu, Server, User } from 'lucide-react';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Skeleton } from '@/components/shadcn/skeleton';
import { useInspectionEvents, useNcrEvents } from '@/hooks/inspection';
import { employeeReferenceLabel } from '@/lib/utils/user-reference';
import {
  type InspectionEvent,
  type InspectionEventActorType,
  inspectionEventChanges,
  inspectionEventEmployeeId,
  inspectionEventSubjectTypeLabels,
  inspectionEventTypeLabel,
} from '@/types/inspection';

const PAGE_SIZE = 25;

/** Which timeline to read: an inspection's, including everything under it, or one NCR's. */
export type TimelineSource =
  | { kind: 'inspection'; id: string }
  | { kind: 'ncr'; id: string };

const ALL_TYPES = 'ALL';

export function InspectionEventTimeline({
  source,
}: {
  source: TimelineSource;
}) {
  const [page, setPage] = useState(0);
  const [eventType, setEventType] = useState(ALL_TYPES);

  const params = { page, size: PAGE_SIZE };
  // Both hooks are called so the hook order is stable; only the one the
  // source names is enabled.
  const byInspection = useInspectionEvents(
    source.kind === 'inspection' ? source.id : undefined,
    params
  );
  const byNcr = useNcrEvents(
    source.kind === 'ncr' ? source.id : undefined,
    params
  );
  const query = source.kind === 'inspection' ? byInspection : byNcr;

  const employeeName = useEmployeeNames();

  if (query.isLoading) {
    return (
      <div className="space-y-3" data-testid="event-timeline">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const data = query.data;
  if (!data || data.totalElements === 0) {
    return (
      <p className="text-muted-foreground text-xs" data-testid="event-timeline">
        No history recorded yet. The log starts with the first change made after
        event recording went live.
      </p>
    );
  }

  // The filter is applied to the page in hand: the per-subject endpoints take
  // no type filter, and a timeline is read top to bottom rather than searched.
  const types = [
    ...new Set(data.content.map((event) => event.eventType)),
  ].toSorted();
  const shown =
    eventType === ALL_TYPES
      ? data.content
      : data.content.filter((event) => event.eventType === eventType);

  return (
    <div className="space-y-4" data-testid="event-timeline">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {data.totalElements} {data.totalElements === 1 ? 'event' : 'events'}
          {data.totalPages > 1 &&
            `, page ${data.number + 1} of ${data.totalPages}`}
        </p>
        {types.length > 1 && (
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger
              className="h-8 w-56 text-xs"
              aria-label="Filter by event type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All event types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {inspectionEventTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <ol className="space-y-4">
        {shown.map((event) => (
          <EventRow key={event.id} event={event} employeeName={employeeName} />
        ))}
      </ol>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={data.number === 0 || query.isFetching}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={data.number + 1 >= data.totalPages || query.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

const ACTOR_ICONS: Record<InspectionEventActorType, typeof User> = {
  USER: User,
  DEVICE: Cpu,
  AI: Bot,
  SYSTEM: Server,
};

function EventRow({
  event,
  employeeName,
}: {
  event: InspectionEvent;
  employeeName: (id?: number) => string | undefined;
}) {
  const Icon = ACTOR_ICONS[event.actorType];
  const changes = inspectionEventChanges(event);
  const employeeId = inspectionEventEmployeeId(event);
  const actor =
    event.actorType === 'USER'
      ? (employeeName(employeeId) ?? employeeReferenceLabel(employeeId))
      : `${event.actorId ?? event.actorType.toLowerCase()} (${event.actorType.toLowerCase()})`;

  return (
    <li className="flex gap-3" data-testid="event-row">
      <div className="flex flex-col items-center">
        <div className="bg-muted grid size-7 shrink-0 place-items-center rounded-full">
          <Icon className="text-muted-foreground size-3.5" />
        </div>
        <div className="bg-border mt-1 w-px flex-1" />
      </div>

      <div className="min-w-0 flex-1 space-y-1 pb-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">
            {inspectionEventTypeLabel(event.eventType)}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {inspectionEventSubjectTypeLabels[event.subjectType]}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {event.occurredAt
              ? format(new Date(event.occurredAt), 'dd MMM yyyy, HH:mm')
              : '—'}
          </span>
        </div>

        <p className="text-muted-foreground text-xs">{actor}</p>

        {changes.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            {changes.map((change) => (
              <ChangeRow key={change.field} {...change} />
            ))}
          </dl>
        )}

        {event.note && <p className="text-sm leading-relaxed">{event.note}</p>}
      </div>
    </li>
  );
}

function ChangeRow({
  field,
  from,
  to,
}: {
  field: string;
  from?: unknown;
  to?: unknown;
}) {
  return (
    <>
      <dt className="text-muted-foreground font-medium">{field}</dt>
      <dd className="min-w-0 break-words">
        {from !== undefined && from !== null && (
          <>
            <span className="text-muted-foreground line-through">
              {display(from)}
            </span>{' '}
            <span className="text-muted-foreground">to</span>{' '}
          </>
        )}
        <span>{display(to)}</span>
      </dd>
    </>
  );
}

/** A changed value as text; objects are shown as JSON rather than "[object Object]". */
function display(value: unknown): string {
  if (value === undefined || value === null) return 'cleared';
  if (typeof value === 'string') return value === '' ? '(empty)' : value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function useEmployeeNames() {
  const { data: employees = [] } = useEmployeeLookup();
  const byId = new Map(
    employees.map((employee) => [employee.id, employee.name])
  );
  return (id?: number): string | undefined => {
    if (id == null) return undefined;
    return byId.get(id) ?? `#${id}`;
  };
}
