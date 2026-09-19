'use client';

import { X } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { ToolboxTalkStatus } from '@tornotron/echno-core/toolbox-talks/types';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { toolboxTalkStatusLabels } from '../lib/labels';

export const ALL = 'ALL';

export interface ToolboxTalkFilterState {
  projectId: string;
  status: string;
  fromDate: string;
  toDate: string;
}

export const EMPTY_FILTERS: ToolboxTalkFilterState = {
  projectId: ALL,
  status: ALL,
  fromDate: '',
  toDate: '',
};

export function hasActiveFilters(filters: ToolboxTalkFilterState): boolean {
  return (
    filters.projectId !== ALL ||
    filters.status !== ALL ||
    filters.fromDate !== '' ||
    filters.toDate !== ''
  );
}

const SELECT_CLASS =
  'border-input bg-background h-9 w-full rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-44';

interface ToolboxTalksFiltersProps {
  filters: ToolboxTalkFilterState;
  onChange: (filters: ToolboxTalkFilterState) => void;
}

export function ToolboxTalksFilters({
  filters,
  onChange,
}: ToolboxTalksFiltersProps) {
  const { data: projects = [] } = useProjects();
  const patch = (changes: Partial<ToolboxTalkFilterState>) =>
    onChange({ ...filters, ...changes });

  return (
    <div
      className="flex flex-wrap items-end gap-3"
      data-testid="toolbox-talks-filters"
    >
      <Field label="Project" htmlFor="filter-project">
        <select
          id="filter-project"
          className={SELECT_CLASS}
          value={filters.projectId}
          onChange={(event) => patch({ projectId: event.target.value })}
        >
          <option value={ALL}>All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={String(project.id)}>
              {project.projectName}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status" htmlFor="filter-status">
        <select
          id="filter-status"
          className={SELECT_CLASS}
          value={filters.status}
          onChange={(event) => patch({ status: event.target.value })}
        >
          <option value={ALL}>All statuses</option>
          {Object.values(ToolboxTalkStatus).map((status) => (
            <option key={status} value={status}>
              {toolboxTalkStatusLabels[status]}
            </option>
          ))}
        </select>
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
