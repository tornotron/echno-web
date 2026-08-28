'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/shadcn/card';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { useNcrDefects } from '@/hooks/inspection';
import {
  NcrSeverity,
  NcrStatus,
  isNcrOverdue,
  ncrSeverityLabels,
  ncrStatusLabels,
} from '@/types/inspection';
import {
  ALL,
  CreateNcrDialog,
  InspectionStats,
  NcrTable,
} from '@/features/inspections/components';

/** Statuses that still require action from someone. */
const ACTIVE_STATUSES = new Set<NcrStatus>([
  NcrStatus.open,
  NcrStatus.assigned,
  NcrStatus.underCorrection,
  NcrStatus.submittedForVerification,
]);

export default function NcrDefectsPage() {
  const { data: defects = [], isLoading } = useNcrDefects();
  const { data: projects = [] } = useProjects();

  const [projectId, setProjectId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [severity, setSeverity] = useState(ALL);

  const filtered = useMemo(
    () =>
      defects.filter((defect) => {
        if (projectId !== ALL && String(defect.projectId) !== projectId)
          return false;
        if (status !== ALL && defect.status !== status) return false;
        if (severity !== ALL && defect.severity !== severity) return false;
        return true;
      }),
    [defects, projectId, status, severity]
  );

  const stats = useMemo(
    () => ({
      total: defects.length,
      open: defects.filter((defect) => ACTIVE_STATUSES.has(defect.status))
        .length,
      overdue: defects.filter((defect) => isNcrOverdue(defect)).length,
      critical: defects.filter(
        (defect) =>
          defect.severity === NcrSeverity.critical &&
          ACTIVE_STATUSES.has(defect.status)
      ).length,
      closed: defects.filter((defect) => defect.status === NcrStatus.closed)
        .length,
    }),
    [defects]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="NCR / Defects"
        description="Non-conformance reports and defect tracking through to closure"
        actions={<CreateNcrDialog />}
      />

      <InspectionStats
        isLoading={isLoading}
        stats={[
          {
            label: 'Total NCRs',
            count: stats.total,
            icon: ShieldAlert,
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Open',
            count: stats.open,
            icon: Wrench,
            description: 'awaiting action',
            valueClass: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-50 dark:bg-amber-950/30',
            iconClass: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Overdue',
            count: stats.overdue,
            icon: CalendarX2,
            description: 'past due date',
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
          <FilterField label="Project" htmlFor="ncr-filter-project">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="ncr-filter-project" className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.projectName}
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

          <FilterField label="Severity" htmlFor="ncr-filter-severity">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger
                id="ncr-filter-severity"
                className="w-full sm:w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Severities</SelectItem>
                {Object.values(NcrSeverity).map((value) => (
                  <SelectItem key={value} value={value}>
                    {ncrSeverityLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </div>
      </Card>

      <NcrTable defects={filtered} isLoading={isLoading} />
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
