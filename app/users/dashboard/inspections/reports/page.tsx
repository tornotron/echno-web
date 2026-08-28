'use client';

/**
 * Reports — frontend only.
 *
 * Every figure here is derived client-side from the inspection and NCR lists
 * already in the query cache. There is no reporting endpoint and none is
 * needed at this stage.
 */

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
} from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Progress } from '@/components/shadcn/progress';
import { Separator } from '@/components/shadcn/separator';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/shadcn/chart';
import {
  useInspections,
  useNcrDefects,
  useResponsibleName,
} from '@/hooks/inspection';
import { downloadCsv } from '@/lib/utils/csv-utils';
import {
  InspectionStatus,
  InspectionType,
  NcrSeverity,
  NcrStatus,
  inspectionResultLabels,
  inspectionStatusLabels,
  inspectionTypeLabels,
  isNcrOverdue,
  ncrDaysOverdue,
  ncrSeverityLabels,
  ncrStatusLabels,
} from '@/types/inspection';
import {
  ALL,
  EMPTY_FILTERS,
  InspectionFilters,
  InspectionStats,
  matchesFilters,
  type InspectionFilterState,
} from '@/features/inspections/components';

const CHART_CONFIG = {
  count: { label: 'Inspections' },
  compliance: { label: 'Compliance', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/** Chart palette drawn from the app's existing theme tokens. */
const SEVERITY_COLORS: Record<NcrSeverity, string> = {
  [NcrSeverity.low]: 'var(--chart-2)',
  [NcrSeverity.medium]: 'var(--chart-3)',
  [NcrSeverity.high]: 'var(--chart-4)',
  [NcrSeverity.critical]: 'var(--chart-5)',
};

export default function InspectionReportsPage() {
  const { data: inspections = [], isLoading } = useInspections();
  const { data: defects = [] } = useNcrDefects();
  const { data: projects = [] } = useProjects();

  const responsibleName = useResponsibleName();

  const [filters, setFilters] = useState<InspectionFilterState>(EMPTY_FILTERS);

  const scoped = useMemo(
    () => inspections.filter((item) => matchesFilters(item, filters)),
    [inspections, filters]
  );

  // NCRs follow the report's project filter; type and status belong to
  // inspections and do not apply to them.
  const scopedDefects = useMemo(
    () =>
      filters.projectId === ALL
        ? defects
        : defects.filter(
            (defect) => String(defect.projectId) === filters.projectId
          ),
    [defects, filters.projectId]
  );

  const summary = useMemo(() => {
    const completed = scoped.filter(
      (item) => item.status === InspectionStatus.completed
    );

    const complianceFor = (type: InspectionType) => {
      const relevant = completed.filter((item) => item.type === type);
      if (relevant.length === 0) return 0;
      return Math.round(
        relevant.reduce((sum, item) => sum + item.compliancePercentage, 0) /
          relevant.length
      );
    };

    return {
      total: scoped.length,
      completed: completed.length,
      open: scoped.filter(
        (item) =>
          item.status === InspectionStatus.scheduled ||
          item.status === InspectionStatus.inProgress
      ).length,
      qaQcCompliance: complianceFor(InspectionType.qaQc),
      safetyCompliance: complianceFor(InspectionType.safety),
      openNcrs: scopedDefects.filter(
        (defect) => defect.status !== NcrStatus.closed
      ).length,
      criticalNcrs: scopedDefects.filter(
        (defect) =>
          defect.severity === NcrSeverity.critical &&
          defect.status !== NcrStatus.closed
      ).length,
    };
  }, [scoped, scopedDefects]);

  const byType = useMemo(
    () =>
      Object.values(InspectionType).map((type) => ({
        type: inspectionTypeLabels[type],
        count: scoped.filter((item) => item.type === type).length,
      })),
    [scoped]
  );

  const bySeverity = useMemo(
    () =>
      Object.values(NcrSeverity)
        .map((severity) => ({
          severity: ncrSeverityLabels[severity],
          count: scopedDefects.filter((defect) => defect.severity === severity)
            .length,
          fill: SEVERITY_COLORS[severity],
        }))
        .filter((entry) => entry.count > 0),
    [scopedDefects]
  );

  /**
   * Average compliance per calendar month across completed inspections.
   *
   * Bucketed by month rather than by inspection so the line answers "is the
   * site getting better?" instead of redrawing every time one more inspection
   * lands. Only completed inspections carry a meaningful score.
   */
  const complianceTrend = useMemo(() => {
    const buckets = new Map<
      string,
      { label: string; sum: number; n: number }
    >();

    for (const item of scoped) {
      if (item.status !== InspectionStatus.completed) continue;

      const key = format(item.inspectionDate, 'yyyy-MM');
      const bucket = buckets.get(key) ?? {
        label: format(item.inspectionDate, 'MMM yyyy'),
        sum: 0,
        n: 0,
      };

      bucket.sum += item.compliancePercentage;
      bucket.n += 1;
      buckets.set(key, bucket);
    }

    return [...buckets.entries()]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([, bucket]) => ({
        month: bucket.label,
        compliance: Math.round(bucket.sum / bucket.n),
        inspections: bucket.n,
      }));
  }, [scoped]);

  const byProject = useMemo(() => {
    const grouped = new Map<string, { total: number; completed: number }>();

    for (const item of scoped) {
      const key = item.projectName ?? `Project #${item.projectId}`;
      const entry = grouped.get(key) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (item.status === InspectionStatus.completed) entry.completed += 1;
      grouped.set(key, entry);
    }

    return [...grouped.entries()]
      .map(([project, value]) => ({ project, ...value }))
      .toSorted((a, b) => b.total - a.total);
  }, [scoped]);

  // Exports carry the report's current scope, not the whole dataset — what you
  // are looking at is what you send on.
  const stamp = format(new Date(), 'yyyy-MM-dd');

  const exportInspections = () => {
    downloadCsv(`inspections-${stamp}.csv`, [
      [
        'Inspection No.',
        'Title',
        'Type',
        'Project',
        'Date',
        'Status',
        'Result',
        'Inspector',
        'Location',
        'Compliance %',
      ],
      ...scoped.map((item) => [
        item.inspectionNumber ?? '',
        item.title,
        inspectionTypeLabels[item.type],
        item.projectName ?? `#${item.projectId}`,
        format(item.inspectionDate, 'yyyy-MM-dd'),
        inspectionStatusLabels[item.status],
        item.result ? inspectionResultLabels[item.result] : '',
        item.inspectorName ?? '',
        item.location ?? '',
        String(item.compliancePercentage),
      ]),
    ]);
  };

  const exportNcrs = () => {
    downloadCsv(`ncrs-${stamp}.csv`, [
      [
        'NCR No.',
        'Title',
        'Project',
        'Severity',
        'Status',
        'Responsible',
        'Due',
        'Overdue',
        'Location',
        'Raised',
      ],
      ...scopedDefects.map((defect) => [
        defect.ncrNumber,
        defect.title,
        defect.projectName ?? `#${defect.projectId}`,
        ncrSeverityLabels[defect.severity],
        ncrStatusLabels[defect.status],
        responsibleName(defect) ?? '',
        defect.dueDate ? format(defect.dueDate, 'yyyy-MM-dd') : '',
        isNcrOverdue(defect) ? `${ncrDaysOverdue(defect)} days` : '',
        defect.location ?? '',
        format(defect.createdAt, 'yyyy-MM-dd'),
      ]),
    ]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Reports"
        description="Inspection and compliance summaries across your projects"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={scoped.length === 0}
              onClick={exportInspections}
            >
              <Download className="size-4" />
              Inspections CSV
            </Button>
            <Button
              variant="outline"
              disabled={scopedDefects.length === 0}
              onClick={exportNcrs}
            >
              <Download className="size-4" />
              NCRs CSV
            </Button>
          </div>
        }
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
            label: 'Completed',
            count: summary.completed,
            icon: CheckCircle2,
            valueClass: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Open',
            count: summary.open,
            icon: Clock,
            valueClass: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconClass: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Critical NCRs',
            count: summary.criticalNcrs,
            icon: AlertTriangle,
            description: `${summary.openNcrs} open in total`,
            valueClass: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-50 dark:bg-red-950/30',
            iconClass: 'text-red-600 dark:text-red-400',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Compliance trend ───────────────────────────────────────────── */}
        <Card className="gap-4 p-6 lg:col-span-2">
          <div>
            <h2 className="text-sm font-semibold">Compliance trend</h2>
            <p className="text-muted-foreground text-xs">
              Monthly average across completed inspections
            </p>
          </div>

          {complianceTrend.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No completed inspections in the selected scope.
            </p>
          ) : (
            <ChartContainer config={CHART_CONFIG} className="h-64 w-full">
              <LineChart
                data={complianceTrend}
                accessibilityLayer
                margin={{ left: 4, right: 12, top: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="compliance"
                  type="monotone"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </Card>

        {/* ── Compliance ─────────────────────────────────────────────────── */}
        <Card className="gap-4 p-6">
          <h2 className="text-sm font-semibold">Compliance</h2>
          <div className="space-y-4">
            <ComplianceBar
              label="QA/QC Compliance"
              value={summary.qaQcCompliance}
            />
            <ComplianceBar
              label="Safety Compliance"
              value={summary.safetyCompliance}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Averaged across completed inspections only.
          </p>
        </Card>

        {/* ── By type ────────────────────────────────────────────────────── */}
        <Card className="gap-4 p-6">
          <h2 className="text-sm font-semibold">Inspections by type</h2>
          <ChartContainer config={CHART_CONFIG} className="h-56 w-full">
            <BarChart data={byType} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="type"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--chart-1)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* ── NCR severity ───────────────────────────────────────────────── */}
        <Card className="gap-4 p-6">
          <h2 className="text-sm font-semibold">NCRs by severity</h2>
          {bySeverity.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No NCRs in the selected scope.
            </p>
          ) : (
            <ChartContainer config={CHART_CONFIG} className="h-56 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={bySeverity}
                  dataKey="count"
                  nameKey="severity"
                  innerRadius={45}
                >
                  {bySeverity.map((entry) => (
                    <Cell key={entry.severity} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </Card>

        {/* ── Per project ────────────────────────────────────────────────── */}
        <Card variant="panel">
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold">
              Project inspection summary
            </h2>
          </div>
          <Separator />
          <div className="divide-border divide-y">
            {byProject.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center text-sm">
                No inspections in the selected scope.
              </p>
            ) : (
              byProject.map((entry) => (
                <div
                  key={entry.project}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {entry.project}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                    {entry.completed} / {entry.total} completed
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ComplianceBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
