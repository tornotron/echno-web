'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  HardHat,
  ShieldAlert,
} from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { useInspections, useNcrDefects } from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  InspectionStatus,
  InspectionType,
  NcrStatus,
} from '@/types/inspection';
import {
  CreateInspectionDialog,
  EMPTY_FILTERS,
  InspectionFilters,
  InspectionStats,
  InspectionTable,
  matchesFilters,
  type InspectionFilterState,
} from '@/features/inspections/components';

export default function InspectionsOverviewPage() {
  const { data: inspections = [], isLoading } = useInspections();
  const { data: defects = [] } = useNcrDefects();
  const { data: projects = [] } = useProjects();

  const [filters, setFilters] = useState<InspectionFilterState>(EMPTY_FILTERS);

  const filtered = useMemo(
    () => inspections.filter((item) => matchesFilters(item, filters)),
    [inspections, filters]
  );

  const summary = useMemo(() => {
    const byType = (type: InspectionType) =>
      inspections.filter((item) => item.type === type).length;

    const openDefects = defects.filter(
      (defect) =>
        defect.status !== NcrStatus.closed &&
        defect.status !== NcrStatus.verified
    ).length;

    return {
      total: inspections.length,
      qaQc: byType(InspectionType.qaQc),
      safety: byType(InspectionType.safety),
      ncr: byType(InspectionType.ncrDefect),
      openIssues: openDefects,
      pendingActions: inspections.filter(
        (item) => item.status === InspectionStatus.inProgress
      ).length,
      completed: inspections.filter(
        (item) => item.status === InspectionStatus.completed
      ).length,
    };
  }, [inspections, defects]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inspections"
        description="Site inspection tracking, checklists and defect management"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={routes.inspections.checklists.href}>
                <ClipboardList className="size-4" />
                Checklists
              </Link>
            </Button>
            <CreateInspectionDialog />
          </div>
        }
      />

      <InspectionStats
        isLoading={isLoading}
        stats={[
          {
            label: 'Total Inspections',
            count: summary.total,
            icon: ClipboardCheck,
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'QA/QC',
            count: summary.qaQc,
            icon: ClipboardCheck,
            iconBg: 'bg-violet-50 dark:bg-violet-950/30',
            iconClass: 'text-violet-600 dark:text-violet-400',
          },
          {
            label: 'Safety',
            count: summary.safety,
            icon: HardHat,
            iconBg: 'bg-amber-50 dark:bg-amber-950/30',
            iconClass: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'NCR / Defects',
            count: summary.ncr,
            icon: ShieldAlert,
            iconBg: 'bg-red-50 dark:bg-red-950/30',
            iconClass: 'text-red-600 dark:text-red-400',
          },
        ]}
      />

      <InspectionStats
        isLoading={isLoading}
        stats={[
          {
            label: 'Open Issues',
            count: summary.openIssues,
            icon: AlertTriangle,
            description: 'need attention',
            valueClass: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-50 dark:bg-red-950/30',
            iconClass: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Pending Actions',
            count: summary.pendingActions,
            icon: ClipboardList,
            description: 'in progress',
            valueClass: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Completed',
            count: summary.completed,
            icon: CheckCircle2,
            description: 'inspections closed',
            valueClass: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
          },
        ]}
      />

      <Card className="p-4">
        <InspectionFilters
          filters={filters}
          onChange={setFilters}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.projectName,
          }))}
        />
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Recent inspections</h2>
        <InspectionTable inspections={filtered} isLoading={isLoading} />
      </div>
    </div>
  );
}
