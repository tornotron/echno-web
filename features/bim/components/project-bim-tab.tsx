'use client';

import Link from 'next/link';
import { Box, ExternalLink } from 'lucide-react';
import { useBimModels } from '@tornotron/echno-core/bim/hooks';
import {
  isBimVersionInProgress,
  type BimModel,
  type BimModelVersion,
} from '@tornotron/echno-core/bim/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { bimViewerHref } from '@/lib/bim/show-in-model-href';
import { HierarchyProposalReview } from './hierarchy-proposal-review';
import { ModelUploadDialog } from './model-upload-dialog';

const STATUS_STYLE: Record<BimModelVersion['status'], string> = {
  UPLOADED: 'bg-zinc-200 text-zinc-800',
  QUEUED: 'bg-amber-100 text-amber-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  INGESTING: 'bg-blue-100 text-blue-800',
  READY: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  UNKNOWN: 'bg-zinc-200 text-zinc-800',
};

interface ProjectBimTabProps {
  projectId: number;
}

/** A project's BIM models with their versions, the upload entry and the viewer link. */
export function ProjectBimTab({ projectId }: ProjectBimTabProps) {
  const { data: models, isLoading } = useBimModels(projectId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const list = models ?? [];

  return (
    <div className="space-y-4" data-testid="project-bim-tab">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          IFC models of this project. Each upload becomes a new version; elements keep their
          identity across versions by IFC GlobalId.
        </p>
        <ModelUploadDialog projectId={projectId} models={list} />
      </div>

      {list.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-zinc-500">
            <Box className="size-8 text-zinc-400" />
            No BIM model yet. Upload an IFC to start.
          </CardContent>
        </Card>
      )}

      {list.map((model) => (
        <ModelCard key={model.id} projectId={projectId} model={model} />
      ))}
    </div>
  );
}

function ModelCard({ projectId, model }: { projectId: number; model: BimModel }) {
  const current = model.versions.find((v) => v.id === model.currentVersionId);
  return (
    <Card data-testid="bim-model-card">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{model.name}</CardTitle>
          {model.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{model.description}</p>
          )}
        </div>
        {current && (
          <Button asChild size="sm">
            <Link href={bimViewerHref(projectId, { model: model.id })}>
              <ExternalLink className="size-4" />
              Open viewer
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {model.versions.map((v) => (
          <div key={v.id} className="rounded-md border p-3" data-testid="bim-version-row">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">v{v.versionNumber}</span>
              <Badge className={STATUS_STYLE[v.status]}>{v.status}</Badge>
              {v.sourceFilename && <span className="text-zinc-500">{v.sourceFilename}</span>}
              {v.ifcSchema && <span className="text-xs text-zinc-500">{v.ifcSchema}</span>}
              {v.elementCount !== undefined && (
                <span className="text-xs text-zinc-500">
                  {v.elementCount} elements · {v.storeyCount ?? 0} storeys
                </span>
              )}
              {isBimVersionInProgress(v.status) && (
                <span className="text-xs text-zinc-500">Import in progress</span>
              )}
            </div>
            {v.status === 'FAILED' && v.error && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">{v.error}</p>
            )}
            {v.status === 'READY' && (
              <div className="mt-3">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Site structure proposal
                </h4>
                <HierarchyProposalReview
                  projectId={projectId}
                  modelId={model.id}
                  versionId={v.id}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
