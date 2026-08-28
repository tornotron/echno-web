'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  type InspectionStatus,
  type InspectionType,
  inspectionStatusLabels,
  inspectionTypeLabels,
  InspectionStatus as StatusEnum,
  InspectionType as TypeEnum,
} from '@/types/inspection';

/** Sentinel for "no filter" — Radix Select cannot hold an empty string value. */
export const ALL = 'ALL';

export interface InspectionFilterState {
  projectId: string;
  type: string;
  status: string;
  /** ISO date; matches inspections on or after this day. */
  fromDate: string;
  toDate: string;
}

export const EMPTY_FILTERS: InspectionFilterState = {
  projectId: ALL,
  type: ALL,
  status: ALL,
  fromDate: '',
  toDate: '',
};

export function hasActiveFilters(filters: InspectionFilterState): boolean {
  return (
    filters.projectId !== ALL ||
    filters.type !== ALL ||
    filters.status !== ALL ||
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
  /** Hidden on the type-specific pages, which pin the type themselves. */
  showTypeFilter?: boolean;
}

export function InspectionFilters({
  filters,
  onChange,
  projects,
  showTypeFilter = true,
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
            <SelectTrigger id="filter-type" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.values(TypeEnum).map((type) => (
                <SelectItem key={type} value={type}>
                  {inspectionTypeLabels[type as InspectionType]}
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
          <SelectTrigger id="filter-status" className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {Object.values(StatusEnum).map((status) => (
              <SelectItem key={status} value={status}>
                {inspectionStatusLabels[status as InspectionStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

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
  projectId: number;
  type: InspectionType;
  status: InspectionStatus;
  inspectionDate: Date;
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

  if (filters.fromDate && item.inspectionDate < new Date(filters.fromDate))
    return false;
  if (filters.toDate) {
    // Inclusive of the whole `to` day.
    const end = new Date(filters.toDate);
    end.setHours(23, 59, 59, 999);
    if (item.inspectionDate > end) return false;
  }

  return true;
}
