'use client';

/**
 * Reports, frontend only.
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/shadcn/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  useInspections,
  useNcrs,
  useResponsibleName,
} from '@/hooks/inspection';
import { downloadCsv } from '@/lib/utils/csv-utils';
import {
  DefectSeverity,
  InspectionStatus,
  InspectionType,
  SETTLED_NCR_STATUSES,
  compliancePercentage,
  defectSeverityLabels,
  inspectionResultLabels,
  inspectionStatusLabels,
  inspectionTypeLabels,
  isNcrOverdue,
  ncrDaysOverdue,
  ncrStatusLabels,
  ncrTypeLabels,
  type Inspection,
} from '@/types/inspection';
import {
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
const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  [DefectSeverity.CRITICAL]: 'var(--chart-5)',
  [DefectSeverity.MAJOR]: 'var(--chart-4)',
  [DefectSeverity.MINOR]: 'var(--chart-2)',
};

/**
 * Statuses that mean the inspection has been carried out and scored.
 *
 * The backend concludes an inspection either by moving it to COMPLETED and
 * setting a separate result, or by putting the outcome straight on the status.
 * A compliance average that looked only at COMPLETED would silently drop every
 * inspection recorded the second way.
 */
const CONCLUDED_STATUSES: ReadonlySet<InspectionStatus> =
  new Set<InspectionStatus>([
    InspectionStatus.COMPLETED,
    InspectionStatus.PASSED,
    InspectionStatus.PASSED_WITH_REMARKS,
    InspectionStatus.FAILED,
  ]);

/** The calendar month an inspection falls in, from its `YYYY-MM-DD` date. */
function monthKey(inspection: Inspection): string | undefined {
  const date = inspection.scheduledDate;
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date.slice(0, 7)
    : undefined;
}

export default function InspectionReportsPage() {
  const { data: inspections = [], isLoading } = useInspections();
  const { data: ncrs = [] } = useNcrs();
  const { data: projects = [] } = useProjects();

  const responsibleName = useResponsibleName();

  const [filters, setFilters] = useState<InspectionFilterState>(EMPTY_FILTERS);

  const scoped = useMemo(
    () => inspections.filter((item) => matchesFilters(item, filters)),
    [inspections, filters]
  );

  const projectName = useMemo(() => {
    const names = new Map(
      projects.map((project) => [project.id, project.projectName])
    );
    return (id?: number) =>
      id === undefined ? undefined : (names.get(id) ?? `Project #${id}`);
  }, [projects]);

  /**
   * An NCR carries no project of its own, only the inspection it was raised
   * against, so it inherits the report's scope through that inspection. Going
   * through the inspection is also what lets the NCR figures honour the type,
   * status and result filters rather than the project alone.
   */
  const scopedNcrs = useMemo(() => {
    const inScope = new Set(scoped.map((item) => item.id));
    return ncrs.filter((ncr) => inScope.has(ncr.inspectionId));
  }, [ncrs, scoped]);

  const summary = useMemo(() => {
    const concluded = scoped.filter((item) =>
      CONCLUDED_STATUSES.has(item.status)
    );

    const complianceFor = (type: InspectionType) => {
      const relevant = concluded.filter((item) => item.type === type);
      if (relevant.length === 0) return 0;
      return Math.round(
        relevant.reduce((sum, item) => sum + compliancePercentage(item), 0) /
          relevant.length
      );
    };

    const unsettled = scopedNcrs.filter(
      (ncr) => !SETTLED_NCR_STATUSES.has(ncr.status)
    );

    return {
      total: scoped.length,
      completed: concluded.length,
      open: scoped.filter(
        (item) =>
          item.status === InspectionStatus.SCHEDULED ||
          item.status === InspectionStatus.IN_PROGRESS
      ).length,
      qualityCompliance: complianceFor(InspectionType.QUALITY),
      safetyCompliance: complianceFor(InspectionType.SAFETY),
      openNcrs: unsettled.length,
      criticalNcrs: unsettled.filter(
        (ncr) => ncr.severity === DefectSeverity.CRITICAL
      ).length,
    };
  }, [scoped, scopedNcrs]);

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
      Object.values(DefectSeverity)
        .map((severity) => ({
          severity: defectSeverityLabels[severity],
          count: scopedNcrs.filter((ncr) => ncr.severity === severity).length,
          fill: SEVERITY_COLORS[severity],
        }))
        .filter((entry) => entry.count > 0),
    [scopedNcrs]
  );

  /**
   * Average compliance per calendar month across concluded inspections.
   *
   * Bucketed by month rather than by inspection so the line answers "is the
   * site getting better?" instead of redrawing every time one more inspection
   * lands. An inspection with no scheduled date is left out rather than
   * dropped into the current month, which would bend the trend upwards.
   */
  const complianceTrend = useMemo(() => {
    const buckets = new Map<string, { sum: number; n: number }>();

    for (const item of scoped) {
      if (!CONCLUDED_STATUSES.has(item.status)) continue;

      const key = monthKey(item);
      if (!key) continue;

      const bucket = buckets.get(key) ?? { sum: 0, n: 0 };
      bucket.sum += compliancePercentage(item);
      bucket.n += 1;
      buckets.set(key, bucket);
    }

    return [...buckets.entries()]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => ({
        month: format(new Date(`${key}-01T00:00:00`), 'MMM yyyy'),
        compliance: Math.round(bucket.sum / bucket.n),
        inspections: bucket.n,
      }));
  }, [scoped]);

  const byProject = useMemo(() => {
    const grouped = new Map<string, { total: number; completed: number }>();

    for (const item of scoped) {
      const key = projectName(item.projectId) ?? 'No project';
      const entry = grouped.get(key) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (CONCLUDED_STATUSES.has(item.status)) entry.completed += 1;
      grouped.set(key, entry);
    }

    return [...grouped.entries()]
      .map(([project, value]) => ({ project, ...value }))
      .toSorted((a, b) => b.total - a.total);
  }, [scoped, projectName]);

  // Exports carry the report's current scope, not the whole dataset: what you
  // are looking at is what you send on.
  const stamp = format(new Date(), 'yyyy-MM-dd');

  const exportInspections = () => {
    downloadCsv(`inspections-${stamp}.csv`, [
      [
        'Inspection No.',
        'Title',
        'Type',
        'Status',
        'Result',
        'Scheduled',
        'Project',
        'Location',
        'Check Points',
        'Passed',
        'Failed',
        'Defects',
        'Compliance %',
      ],
      ...scoped.map((item) => [
        item.inspectionNumber,
        item.title,
        inspectionTypeLabels[item.type],
        inspectionStatusLabels[item.status],
        item.result ? inspectionResultLabels[item.result] : '',
        item.scheduledDate ?? '',
        projectName(item.projectId) ?? '',
        item.location ?? '',
        String(item.totalCheckPoints),
        String(item.passedCheckPoints),
        String(item.failedCheckPoints),
        String(item.defectsFound),
        String(compliancePercentage(item)),
      ]),
    ]);
  };

  const exportNcrs = () => {
    downloadCsv(`ncrs-${stamp}.csv`, [
      [
        'NCR No.',
        'Type',
        'Title',
        'Severity',
        'Status',
        'Target Date',
        'Overdue',
        'Site Engineer',
        'Inspection',
        'Raised',
      ],
      ...scopedNcrs.map((ncr) => [
        ncr.ncrNumber,
        ncrTypeLabels[ncr.type],
        ncr.title,
        defectSeverityLabels[ncr.severity],
        ncrStatusLabels[ncr.status],
        ncr.targetDate ?? '',
        isNcrOverdue(ncr) ? `${ncrDaysOverdue(ncr)} days` : '',
        responsibleName(ncr.siteEngineerId) ??
          (ncr.siteEngineerId ? `#${ncr.siteEngineerId}` : ''),
        ncr.inspectionId,
        ncr.createdAt?.slice(0, 10) ?? '',
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
              disabled={scopedNcrs.length === 0}
              onClick={exportNcrs}
            >
              <Download className="size-4" />
              NCRs CSV
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        {/*
          The date window is offered here but not on the inspection list: this
          page derives every figure from the rows already in the query cache,
          so the range is applied to the same set the charts are drawn from.
        */}
        <InspectionFilters
          filters={filters}
          onChange={setFilters}
          showDateRange
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
              Monthly average across concluded inspections
            </p>
          </div>

          {complianceTrend.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No concluded inspections with a scheduled date in the selected
              scope.
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
              label="Quality Compliance"
              value={summary.qualityCompliance}
            />
            <ComplianceBar
              label="Safety Compliance"
              value={summary.safetyCompliance}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Share of check points passed, ignoring those marked not applicable,
            averaged across concluded inspections only.
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
