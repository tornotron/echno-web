'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Loader2, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  CompliancePhase,
  compliancePhaseLabels,
  compliancePhaseOrder,
  complianceRiskLevelLabels,
  complianceRiskLevelBadgeColors,
  inspectionStatusLabels,
  type Inspection,
} from '@/types/inspection';
import {
  useComplianceInspectionsByProject,
  useRegenerateCompliance,
} from '@/hooks/inspection';
import { routes } from '@/nav';

interface ProjectComplianceTabProps {
  projectId: number;
}

export function ProjectComplianceTab({ projectId }: ProjectComplianceTabProps) {
  const {
    data: compliances = [],
    isLoading,
    isError,
  } = useComplianceInspectionsByProject(projectId);
  const regenerate = useRegenerateCompliance();

  // Group compliances by their lifecycle phase; anything without a phase falls
  // into an "Unphased" bucket rendered after the ordered sections.
  const grouped = useMemo(() => {
    const map = new Map<CompliancePhase, Inspection[]>();
    const unphased: Inspection[] = [];
    for (const c of compliances) {
      if (c.compliancePhase) {
        const list = map.get(c.compliancePhase) ?? [];
        list.push(c);
        map.set(c.compliancePhase, list);
      } else {
        unphased.push(c);
      }
    }
    return { map, unphased };
  }, [compliances]);

  const hasAny = compliances.length > 0;
  const isGenerating = regenerate.isPending;
  const actionLabel = hasAny
    ? 'Regenerate compliance'
    : 'Generate compliance';
  const actionIcon = hasAny ? (
    <RefreshCw className="mr-2 h-4 w-4" />
  ) : (
    <Sparkles className="mr-2 h-4 w-4" />
  );

  const handleGenerate = () => {
    regenerate.mutate(projectId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="h-5 w-5" />
            Compliance
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Statutory compliances the AI analysis identified for this project,
            grouped by construction phase.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              {actionIcon}
              {actionLabel}
            </>
          )}
        </Button>
      </div>

      <ComplianceBody
        isLoading={isLoading}
        isError={isError}
        hasAny={hasAny}
        grouped={grouped}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
      />
    </div>
  );
}

interface ComplianceBodyProps {
  isLoading: boolean;
  isError: boolean;
  hasAny: boolean;
  grouped: { map: Map<CompliancePhase, Inspection[]>; unphased: Inspection[] };
  isGenerating: boolean;
  onGenerate: () => void;
}

function ComplianceBody({
  isLoading,
  isError,
  hasAny,
  grouped,
  isGenerating,
  onGenerate,
}: ComplianceBodyProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Could not load compliances. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasAny) {
    return (
      <div className="space-y-6">
        {compliancePhaseOrder.map((phase) => {
          const items = grouped.map.get(phase) ?? [];
          if (items.length === 0) return null;
          return (
            <PhaseSection
              key={phase}
              title={compliancePhaseLabels[phase]}
              items={items}
            />
          );
        })}
        {grouped.unphased.length > 0 && (
          <PhaseSection title="Unphased" items={grouped.unphased} />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
        <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No compliance analysis yet
        </h3>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          Generate to analyse required compliances.
        </p>
        <Button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate compliance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function PhaseSection({
  title,
  items,
}: {
  title: string;
  items: Inspection[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? 'compliance' : 'compliances'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={routes.inspections.detail(item.id).href}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-900"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  {item.inspectionNumber}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.riskLevel && (
                  <Badge
                    className={complianceRiskLevelBadgeColors[item.riskLevel]}
                  >
                    {complianceRiskLevelLabels[item.riskLevel]} risk
                  </Badge>
                )}
                <Badge variant="outline">
                  {inspectionStatusLabels[item.status]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
