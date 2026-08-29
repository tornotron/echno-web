'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInspections, useNcrs } from '@/hooks/inspection';
import type { NcrListParams } from '@tornotron/echno-core/ncr/services';
import {
  DefectSeverity,
  NcrStatus,
  NcrType,
  SETTLED_NCR_STATUSES,
  isNcrOverdue,
  ncrStatusLabels,
  ncrTypeLabels,
} from '@/types/inspection';
import { CreateNcrDialog } from '@/features/inspections/components/create-ncr-dialog';
import { InspectionStats } from '@/features/inspections/components/inspection-stats';
import { NcrTable } from '@/features/inspections/components/ncr-table';

/** Sentinel for "no filter": Radix Select cannot hold an empty string value. */
const ALL = 'ALL';

export default function NcrPage() {
  const [inspectionId, setInspectionId] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [siteEngineerId, setSiteEngineerId] = useState(ALL);
  const [openOnly, setOpenOnly] = useState(false);

  const { data: inspections = [] } = useInspections();
  const { data: employees = [] } = useEmployeeLookup();

  /*
    Every filter here is one the list endpoint understands, so filtering runs
    server-side. Nothing is narrowed in the browser: the endpoint is paged, and
    a client-side filter over one page would quietly hide matching rows.
  */
  const params = useMemo<NcrListParams>(
    () => ({
      inspectionId: inspectionId === ALL ? undefined : inspectionId,
      type: type === ALL ? undefined : (type as NcrType),
      status: status === ALL ? undefined : (status as NcrStatus),
      siteEngineerId:
        siteEngineerId === ALL ? undefined : Number(siteEngineerId),
      open: openOnly ? true : undefined,
    }),
    [inspectionId, type, status, siteEngineerId, openOnly]
  );

  const { data: ncrs = [], isLoading } = useNcrs(params);

  // Counted over what the current filters returned, not over the whole
  // register: the endpoint answers one filtered query at a time.
  const stats = useMemo(
    () => ({
      total: ncrs.length,
      active: ncrs.filter((ncr) => !SETTLED_NCR_STATUSES.has(ncr.status))
        .length,
      overdue: ncrs.filter((ncr) => isNcrOverdue(ncr)).length,
      critical: ncrs.filter(
        (ncr) =>
          ncr.severity === DefectSeverity.CRITICAL &&
          !SETTLED_NCR_STATUSES.has(ncr.status)
      ).length,
      closed: ncrs.filter((ncr) => ncr.status === NcrStatus.CLOSED).length,
    }),
    [ncrs]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="NCRs"
        description="Non-conformance reports and their sign-off through to closure"
        actions={<CreateNcrDialog />}
      />

      <InspectionStats
        isLoading={isLoading}
        stats={[
          {
            label: 'In View',
            count: stats.total,
            icon: ShieldAlert,
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Awaiting Action',
            count: stats.active,
            icon: Wrench,
            description: 'not yet verified',
            valueClass: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-50 dark:bg-amber-950/30',
            iconClass: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Overdue',
            count: stats.overdue,
            icon: CalendarX2,
            description: 'past target date',
            valueClass: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-50 dark:bg-red-950/30',
            iconClass: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Critical',
            count: stats.critical,
            icon: AlertTriangle,
            description: 'open and critical',
            valueClass: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-50 dark:bg-red-950/30',
            iconClass: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Closed',
            count: stats.closed,
            icon: CheckCircle2,
            valueClass: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
          },
        ]}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <FilterField label="Inspection" htmlFor="ncr-filter-inspection">
            <Select value={inspectionId} onValueChange={setInspectionId}>
              <SelectTrigger
                id="ncr-filter-inspection"
                className="w-full sm:w-64"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Inspections</SelectItem>
                {inspections.map((inspection) => (
                  <SelectItem key={inspection.id} value={inspection.id}>
                    {inspection.inspectionNumber} · {inspection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Type" htmlFor="ncr-filter-type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="ncr-filter-type" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Types</SelectItem>
                {Object.values(NcrType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {ncrTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Status" htmlFor="ncr-filter-status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="ncr-filter-status" className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                {Object.values(NcrStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {ncrStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Site Engineer" htmlFor="ncr-filter-engineer">
            <Select value={siteEngineerId} onValueChange={setSiteEngineerId}>
              <SelectTrigger
                id="ncr-filter-engineer"
                className="w-full sm:w-52"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Anyone</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {/*
            The punch list. Kept as its own control rather than folded into
            Status, because "not closed" spans six of the seven statuses.
          */}
          <FilterField label="Show" htmlFor="ncr-filter-open">
            <Select
              value={openOnly ? 'OPEN' : ALL}
              onValueChange={(value) => setOpenOnly(value === 'OPEN')}
            >
              <SelectTrigger id="ncr-filter-open" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Everything</SelectItem>
                <SelectItem value="OPEN">Not Closed</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </div>
      </Card>

      <NcrTable ncrs={ncrs} isLoading={isLoading} />
    </div>
  );
}

function FilterField({
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
