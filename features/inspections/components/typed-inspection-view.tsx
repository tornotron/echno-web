'use client';

/**
 * The list view behind the QA/QC and Safety pages.
 *
 * Both inspection types run on the same engine and differ only in the type
 * they pin and the templates they offer, so they share one implementation
 * rather than two near-identical pages.
 */

import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock, Percent } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/shadcn/card';
import { useInspections } from '@/hooks/inspection';
import { type InspectionType, InspectionStatus } from '@/types/inspection';
import { CreateInspectionDialog } from './create-inspection-dialog';
import {
  EMPTY_FILTERS,
  InspectionFilters,
  matchesFilters,
  type InspectionFilterState,
} from './inspection-filters';
import { InspectionStats } from './inspection-stats';
import { InspectionTable } from './inspection-table';

interface TypedInspectionViewProps {
  type: InspectionType;
  title: string;
  description: string;
}

export function TypedInspectionView({
  type,
  title,
  description,
}: TypedInspectionViewProps) {
  const { data: allInspections = [], isLoading } = useInspections();
  const { data: projects = [] } = useProjects();
  const [filters, setFilters] = useState<InspectionFilterState>(EMPTY_FILTERS);

  const inspections = useMemo(
    () => allInspections.filter((item) => item.type === type),
    [allInspections, type]
  );

  const filtered = useMemo(
    () => inspections.filter((item) => matchesFilters(item, filters)),
    [inspections, filters]
  );

  const stats = useMemo(() => {
    const completed = inspections.filter(
      (item) => item.status === InspectionStatus.completed
    );
    const compliance =
      completed.length === 0
        ? 0
        : Math.round(
            completed.reduce(
              (sum, item) => sum + item.compliancePercentage,
              0
            ) / completed.length
          );

    return {
      total: inspections.length,
      open: inspections.filter(
        (item) =>
          item.status === InspectionStatus.scheduled ||
          item.status === InspectionStatus.inProgress
      ).length,
      completed: completed.length,
      compliance,
    };
  }, [inspections]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<CreateInspectionDialog type={type} />}
      />

      <InspectionStats
        isLoading={isLoading}
        stats={[
          {
            label: 'Total',
            count: stats.total,
            icon: ClipboardCheck,
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Open',
            count: stats.open,
            icon: Clock,
            description: 'scheduled or in progress',
            valueClass: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Completed',
            count: stats.completed,
            icon: CheckCircle2,
            valueClass: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Avg. Compliance',
            count: `${stats.compliance}%`,
            icon: Percent,
            description: 'across completed',
            iconBg: 'bg-violet-50 dark:bg-violet-950/30',
            iconClass: 'text-violet-600 dark:text-violet-400',
          },
        ]}
      />

      <Card className="p-4">
        <InspectionFilters
          filters={filters}
          onChange={setFilters}
          showTypeFilter={false}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.projectName,
          }))}
        />
      </Card>

      <InspectionTable
        inspections={filtered}
        isLoading={isLoading}
        showType={false}
        emptyMessage={`No ${title.toLowerCase()} inspections yet. Create one to get started.`}
      />
    </div>
  );
}
