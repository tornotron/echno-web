'use client';

import { format } from 'date-fns';
import { Search } from 'lucide-react';
import type { Project } from '@tornotron/echno-core/project/types';
import { AttendanceStatus } from '@tornotron/echno-core/attendance/types';
import { CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import type {
  ApprovalDecisionFilter,
  GeofenceHoldFilter,
} from '@/features/attendance/lib/attendance-list-filters';

interface Props {
  /** Free-text search on employee name or employee id. */
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  /** Selected {@link AttendanceStatus} value, or `'all'`. */
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  /** Whether to narrow to the days held for a geofence decision. */
  geofenceHoldFilter: GeofenceHoldFilter;
  onGeofenceHoldFilterChange: (value: GeofenceHoldFilter) => void;
  /** Whether to narrow to a point in the approval workflow. */
  decisionFilter: ApprovalDecisionFilter;
  onDecisionFilterChange: (value: ApprovalDecisionFilter) => void;
  /** Selected project id as a string, or `'all'`. */
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  /** The projects the viewer may pick from. */
  projects: Project[];
  /** The day being listed. */
  selectedDate: Date;
  onSelectedDateChange: (value: Date) => void;
  /** Rows per page, as the pager holds it. */
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

/**
 * The filter bar above the project attendance list.
 *
 * Seven controls that between them describe one question to the server: which
 * employees, on which day, in which project, in which attendance and approval
 * state, and how many rows at a time. They are kept in one component because
 * they are one bar; splitting off the newer geofence and decision controls
 * would leave a single row of controls living in two files.
 *
 * Presentational on purpose. The values live on the page, because the same
 * values also drive the list below and the request built by
 * {@link attendanceListParamsFrom}; this component reads them and reports
 * changes back. Which changes reset the pager is therefore the page's
 * decision, not this component's, and the date control deliberately does not
 * reset it.
 */
export function AttendanceFilterBar({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  geofenceHoldFilter,
  onGeofenceHoldFilterChange,
  decisionFilter,
  onDecisionFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  selectedDate,
  onSelectedDateChange,
  itemsPerPage,
  onItemsPerPageChange,
}: Props) {
  return (
    <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search by name or employee ID…"
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusFilterChange(value)}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value={AttendanceStatus.present}>Present</SelectItem>
          <SelectItem value={AttendanceStatus.absent}>Absent</SelectItem>
          <SelectItem value={AttendanceStatus.late}>Late</SelectItem>
          <SelectItem value={AttendanceStatus.halfDay}>Half Day</SelectItem>
          <SelectItem value={AttendanceStatus.overtime}>Overtime</SelectItem>
          <SelectItem value={AttendanceStatus.pendingRegularization}>
            Pending
          </SelectItem>
        </SelectContent>
      </Select>

      {/*
        The two geofence filters, deliberately two controls. `held` is the
        selective one; a pending decision is the state every record is
        created in, so it describes nearly the whole day. Kept apart so an
        approver can ask for the days that were held and have since been
        approved, which one combined control could not express.
      */}
      <Select
        value={geofenceHoldFilter}
        onValueChange={(value) =>
          onGeofenceHoldFilterChange(value as GeofenceHoldFilter)
        }
      >
        <SelectTrigger
          className="h-8 w-[190px] text-xs"
          title="A day is marked away from site when the employee punched in or out from outside the project's site boundary and gave a reason for it."
        >
          <SelectValue placeholder="Marked from anywhere" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Marked from anywhere</SelectItem>
          <SelectItem value="held">Marked away from site</SelectItem>
          <SelectItem value="withinBoundary">Marked on site only</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={decisionFilter}
        onValueChange={(value) =>
          onDecisionFilterChange(value as ApprovalDecisionFilter)
        }
      >
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Any decision" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any decision</SelectItem>
          <SelectItem value="pending">Awaiting a decision</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={projectFilter}
        onValueChange={(value) => onProjectFilterChange(value)}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="All Projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.projectName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={format(selectedDate, 'yyyy-MM-dd')}
        onChange={(e) => onSelectedDateChange(new Date(e.target.value))}
        className="h-8 w-[150px] text-xs"
      />

      <div className="ml-auto flex items-center gap-2 border-l pl-3">
        <span className="text-xs whitespace-nowrap text-zinc-500">
          Rows per page
        </span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(v) => onItemsPerPageChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[60px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
  );
}
