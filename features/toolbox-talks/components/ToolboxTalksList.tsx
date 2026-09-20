'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useToolboxTalks } from '@tornotron/echno-core/toolbox-talks/hooks';
import type {
  ToolboxTalkListParams,
  ToolboxTalkStatus,
} from '@tornotron/echno-core/toolbox-talks/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { routes } from '@/nav';
import { toolboxTalkStatusLabels } from '../lib/labels';
import {
  ALL,
  EMPTY_FILTERS,
  ToolboxTalksFilters,
  type ToolboxTalkFilterState,
} from './ToolboxTalksFilters';
import { ToolboxTalkLocation } from './ToolboxTalkLocation';

const PAGE_SIZE = 20;

function toListParams(
  filters: ToolboxTalkFilterState,
  pageNo: number
): ToolboxTalkListParams {
  return {
    projectId:
      filters.projectId === ALL ? undefined : Number(filters.projectId),
    status:
      filters.status === ALL
        ? undefined
        : (filters.status as ToolboxTalkStatus),
    from: filters.fromDate || undefined,
    to: filters.toDate || undefined,
    pageNo,
    pageSize: PAGE_SIZE,
  };
}

export function ToolboxTalksList() {
  const [filters, setFilters] = useState<ToolboxTalkFilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error } = useToolboxTalks(
    toListParams(filters, page)
  );
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();

  const projectName = useMemo(() => {
    const byId = new Map(
      projects.map((project) => [project.id, project.projectName])
    );
    return (id: number) => byId.get(id) ?? `#${id}`;
  }, [projects]);
  const employeeName = useMemo(() => {
    const byId = new Map(
      employees.map((employee) => [employee.id, employee.name])
    );
    return (id: number) => byId.get(id) ?? `#${id}`;
  }, [employees]);

  return (
    <div className="flex flex-col gap-4" data-testid="toolbox-talks-list">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ToolboxTalksFilters
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(0);
          }}
        />
        <Button size="sm" asChild>
          <Link href={routes.toolboxTalks.new}>
            <Plus className="size-4" />
            New talk
          </Link>
        </Button>
      </div>
      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading
        </div>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(error)}
        </p>
      )}
      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead className="text-right">Attendees</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No talks recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {data.content.map((talk) => (
                <TableRow key={talk.id}>
                  <TableCell>
                    <Link
                      href={routes.toolboxTalks.detail(talk.id).href}
                      className="font-medium hover:underline"
                    >
                      {talk.topic}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {talk.talkDate}
                    {talk.talkTime && (
                      <span className="text-muted-foreground">
                        {' '}
                        {talk.talkTime.slice(0, 5)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{projectName(talk.projectId)}</TableCell>
                  <TableCell className="text-xs">
                    <ToolboxTalkLocation
                      projectId={talk.projectId}
                      spatialNodeId={talk.spatialNodeId}
                    />
                  </TableCell>
                  <TableCell>
                    {employeeName(talk.conductorEmployeeId)}
                  </TableCell>
                  <TableCell className="text-right">
                    {talk.attendees.length}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        talk.status === 'RECORDED' ? 'default' : 'outline'
                      }
                    >
                      {toolboxTalkStatusLabels[talk.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between text-sm">
            <span>
              Page {data.page + 1} of {Math.max(data.totalPages, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
