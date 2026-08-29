'use client';

/**
 * The list view behind the QA/QC and Safety pages.
 *
 * Both pages differ only in the inspection category they pin, so they share
 * one implementation rather than two near-identical copies.
 *
 * The axis is the **category**, not the type. `InspectionCategory` is what the
 * backend groups on, and its `defaultFor` maps seven types (quality,
 * structural, electrical, plumbing, finishing, progress and final) onto
 * QA_QC. Filtering on `InspectionType.QUALITY` instead, as this did, hid six
 * of those seven from the page the whole team looks at. Safety only appeared
 * to work because it maps one to one.
 */

import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock, Percent } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { useInspections } from '@/hooks/inspection';
import {
  type InspectionCategory,
  InspectionStatus,
  InspectionType,
  compliancePercentage,
  defaultInspectionCategoryFor,
} from '@/types/inspection';
import { CreateInspectionDialog } from './create-inspection-dialog';
import {
  EMPTY_FILTERS,
  InspectionFilters,
  matchesFilters,
  type InspectionFilterState,
} from './inspection-filters';
import { InspectionStats } from './inspection-stats';
import { InspectionTable } from './inspection-table';

/**
 * Statuses that mean the inspection is over and its score is final. The
 * backend concludes an inspection into one of the outcome statuses rather
 * than leaving everything at COMPLETED, so an average that only counted
 * COMPLETED would miss most of the finished work.
 */
const CONCLUDED_STATUSES = new Set<InspectionStatus>([
  InspectionStatus.COMPLETED,
  InspectionStatus.PASSED,
  InspectionStatus.PASSED_WITH_REMARKS,
  InspectionStatus.FAILED,
]);

interface TypedInspectionViewProps {
  /** The axis the page is pinned to, and the filter the server applies. */
  category: InspectionCategory;
  /**
   * Type the create dialog pins. A category spans several types, so this is
   * the one the page creates by default, not the one it lists.
   */
  createType: InspectionType;
  title: string;
  description: string;
  /**
   * Offers the trade filter. Trade is populated only for QA/QC inspections,
   * so it is noise on the safety page.
   */
  showTradeFilter?: boolean;
}

export function TypedInspectionView({
  category,
  createType,
  title,
  description,
  showTradeFilter = false,
}: TypedInspectionViewProps) {
  // Filtered by the server, not in the browser: the endpoint takes `category`,
  // and narrowing here would only ever look at the page already loaded.
  const { data: inspections = [], isLoading } = useInspections({ category });
  const { data: projects = [] } = useProjects();
  const [filters, setFilters] = useState<InspectionFilterState>(EMPTY_FILTERS);

  const filtered = useMemo(
    () => inspections.filter((item) => matchesFilters(item, filters)),
    [inspections, filters]
  );

  /**
   * Whether this category covers more than one type, read off core's mapping
   * rather than listed here. QA/QC covers seven types and safety covers one,
   * so the type column earns its place on the first and is noise on the
   * second. Deriving it keeps the page correct if the backend moves a type
   * between categories; a list copied into web would quietly drift.
   */
  const spansSeveralTypes = useMemo(
    () =>
      Object.values(InspectionType).filter(
        (type) => defaultInspectionCategoryFor(type) === category
      ).length > 1,
    [category]
  );

  const stats = useMemo(() => {
    const concluded = inspections.filter((item) =>
      CONCLUDED_STATUSES.has(item.status)
    );
    const compliance =
      concluded.length === 0
        ? 0
        : Math.round(
            concluded.reduce(
              (sum, item) => sum + compliancePercentage(item),
              0
            ) / concluded.length
          );

    return {
      total: inspections.length,
      open: inspections.filter(
        (item) =>
          item.status === InspectionStatus.SCHEDULED ||
          item.status === InspectionStatus.IN_PROGRESS
      ).length,
      completed: concluded.length,
      compliance,
    };
  }, [inspections]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<CreateInspectionDialog type={createType} />}
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
            label: 'Concluded',
            count: stats.completed,
            icon: CheckCircle2,
            description: 'completed, passed or failed',
            valueClass: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Avg. Compliance',
            count: `${stats.compliance}%`,
            icon: Percent,
            description: 'across concluded',
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
          showTradeFilter={showTradeFilter}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.projectName,
          }))}
        />
      </Card>

      <InspectionTable
        inspections={filtered}
        isLoading={isLoading}
        showType={spansSeveralTypes}
        emptyMessage={`No ${title.toLowerCase()} inspections yet. Create one to get started.`}
      />
    </div>
  );
}
