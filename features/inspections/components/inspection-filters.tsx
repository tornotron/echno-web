'use client';

/**
 * Filter bar for the inspection lists.
 *
 * The four selects mirror the filters the list endpoint actually accepts
 * (project, type, status, result). There is deliberately no free-text search:
 * the backend offers none, and searching client-side would only look at the
 * page already in hand while quietly hiding matches on the next one.
 *
 * The date range is the exception, and it is off by default. The backend has
 * no date param either, so it is a purely local narrowing; that is honest on
 * the reports page, which already derives every figure from the rows it holds,
 * and misleading on a paginated list, which does not.
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type InspectionResult,
  type InspectionStatus,
  type InspectionTrade,
  type InspectionType,
  inspectionResultLabels,
  inspectionStatusLabels,
  inspectionTradeLabels,
  inspectionTradeOrder,
  inspectionTypeLabels,
  InspectionResult as ResultEnum,
  InspectionStatus as StatusEnum,
  InspectionType as TypeEnum,
} from '@/types/inspection';

/** Sentinel for "no filter": Radix Select cannot hold an empty string value. */
export const ALL = 'ALL';

export interface InspectionFilterState {
  projectId: string;
  type: string;
  status: string;
  result: string;
  /** Trade, the axis a QA/QC user actually slices by. Only they carry one. */
  trade: string;
  /** `YYYY-MM-DD`, inclusive. Empty means unbounded. */
  fromDate: string;
  /** `YYYY-MM-DD`, inclusive. Empty means unbounded. */
  toDate: string;
}

export const EMPTY_FILTERS: InspectionFilterState = {
  projectId: ALL,
  type: ALL,
  status: ALL,
  result: ALL,
  trade: ALL,
  fromDate: '',
  toDate: '',
};

export function hasActiveFilters(filters: InspectionFilterState): boolean {
  return (
    filters.projectId !== ALL ||
    filters.type !== ALL ||
    filters.status !== ALL ||
    filters.result !== ALL ||
    filters.trade !== ALL ||
    filters.fromDate !== '' ||
    filters.toDate !== ''
  );
}

interface ProjectFilterOption {
  id: number;
  name: string;
}

interface InspectionFiltersProps {
  filters: InspectionFilterState;
  onChange: (filters: InspectionFilterState) => void;
  projects: ProjectFilterOption[];
  /** Hidden on the category pages, which pin their own axis. */
  showTypeFilter?: boolean;
  /**
   * Shows the trade filter. Off by default: only QA/QC inspections carry a
   * trade, so it would be a dropdown of dead options anywhere else.
   */
  showTradeFilter?: boolean;
  /**
   * Shows the scheduled-date range. Off by default, because it narrows only
   * the rows already loaded; turn it on where the whole set is in hand.
   */
  showDateRange?: boolean;
}

export function InspectionFilters({
  filters,
  onChange,
  projects,
  showTypeFilter = true,
  showTradeFilter = false,
  showDateRange = false,
}: InspectionFiltersProps) {
  const patch = (next: Partial<InspectionFilterState>) =>
    onChange({ ...filters, ...next });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Project" htmlFor="filter-project">
        <Select
          value={filters.projectId}
          onValueChange={(value) => patch({ projectId: value })}
        >
          <SelectTrigger id="filter-project" className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {showTypeFilter && (
        <Field label="Type" htmlFor="filter-type">
          <Select
            value={filters.type}
            onValueChange={(value) => patch({ type: value })}
          >
            <SelectTrigger id="filter-type" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.values(TypeEnum).map((type) => (
                <SelectItem key={type} value={type}>
                  {inspectionTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="Status" htmlFor="filter-status">
        <Select
          value={filters.status}
          onValueChange={(value) => patch({ status: value })}
        >
          <SelectTrigger id="filter-status" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {Object.values(StatusEnum).map((status) => (
              <SelectItem key={status} value={status}>
                {inspectionStatusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Result" htmlFor="filter-result">
        <Select
          value={filters.result}
          onValueChange={(value) => patch({ result: value })}
        >
          <SelectTrigger id="filter-result" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Results</SelectItem>
            {Object.values(ResultEnum).map((result) => (
              <SelectItem key={result} value={result}>
                {inspectionResultLabels[result]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {showTradeFilter && (
        <Field label="Trade" htmlFor="filter-trade">
          <Select
            value={filters.trade}
            onValueChange={(value) => patch({ trade: value })}
          >
            <SelectTrigger id="filter-trade" className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All trades</SelectItem>
              {inspectionTradeOrder.map((trade) => (
                <SelectItem key={trade} value={trade}>
                  {inspectionTradeLabels[trade]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {showDateRange && (
        <>
          <Field label="From" htmlFor="filter-from">
            <Input
              id="filter-from"
              type="date"
              className="w-full sm:w-40"
              value={filters.fromDate}
              onChange={(event) => patch({ fromDate: event.target.value })}
            />
          </Field>

          <Field label="To" htmlFor="filter-to">
            <Input
              id="filter-to"
              type="date"
              className="w-full sm:w-40"
              value={filters.toDate}
              onChange={(event) => patch({ toDate: event.target.value })}
            />
          </Field>
        </>
      )}

      {hasActiveFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Predicate
// ---------------------------------------------------------------------------

interface FilterableInspection {
  projectId?: number;
  type: InspectionType;
  status: InspectionStatus;
  result?: InspectionResult;
  trade?: InspectionTrade;
  scheduledDate?: string;
}

/** Shared by every inspection list so filtering behaves identically. */
export function matchesFilters(
  item: FilterableInspection,
  filters: InspectionFilterState
): boolean {
  if (filters.projectId !== ALL && String(item.projectId) !== filters.projectId)
    return false;
  if (filters.type !== ALL && item.type !== filters.type) return false;
  if (filters.status !== ALL && item.status !== filters.status) return false;
  if (filters.result !== ALL && item.result !== filters.result) return false;
  // An inspection with no trade cannot match a trade the user asked for.
  if (filters.trade !== ALL && item.trade !== filters.trade) return false;

  // Both sides are `YYYY-MM-DD`, which sorts correctly as text, so comparing
  // the strings keeps the window free of any timezone shift a Date would add.
  // An unscheduled inspection has no date to fall inside a window, so it drops
  // out as soon as one is set.
  if (filters.fromDate || filters.toDate) {
    if (!item.scheduledDate) return false;
    if (filters.fromDate && item.scheduledDate < filters.fromDate) return false;
    if (filters.toDate && item.scheduledDate > filters.toDate) return false;
  }

  return true;
}
