'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  useBimHierarchyProposal,
  useConfirmBimHierarchy,
  useRegenerateBimHierarchyProposal,
} from '@tornotron/echno-core/bim/hooks';
import type {
  ProposedBimBuilding,
  ProposedBimFloor,
} from '@tornotron/echno-core/bim/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';

interface HierarchyProposalReviewProps {
  projectId: number;
  modelId: string;
  versionId: string;
}

/**
 * The site structure the worker read from the IFC's spatial containment,
 * pending confirmation into the project's `Building > Floor > Zone > Element`
 * tree. Nodes that already exist show as matched; the rest are created.
 */
export function HierarchyProposalReview({
  projectId,
  modelId,
  versionId,
}: HierarchyProposalReviewProps) {
  const { data: proposal, isLoading } = useBimHierarchyProposal(modelId, versionId);
  const regenerate = useRegenerateBimHierarchyProposal(modelId);
  const confirm = useConfirmBimHierarchy(modelId, projectId);

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!proposal) return null;

  const counts = proposal.counts;
  const confirmed = !!proposal.confirmedAt;

  function run(includeElements: boolean) {
    confirm.mutate(
      { versionId, data: { includeElements } },
      {
        onSuccess: (p) => {
          const r = p.confirmation;
          toast.success(
            r
              ? `Site structure confirmed: ${r.nodesCreated} created, ${r.nodesMatched} matched, ${r.elementsLinked} elements linked.`
              : 'Site structure confirmed.'
          );
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <div className="space-y-3" data-testid="hierarchy-proposal">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{counts.buildings ?? 0} buildings</Badge>
        <Badge variant="secondary">{counts.floors ?? 0} floors</Badge>
        <Badge variant="secondary">{counts.zones ?? 0} zones</Badge>
        <Badge variant="secondary">{counts.elements ?? 0} elements</Badge>
        {counts.matched ? <Badge variant="outline">{counts.matched} matched</Badge> : null}
        {counts.unplaced ? (
          <Badge variant="outline">{counts.unplaced} without a storey</Badge>
        ) : null}
        {confirmed && (
          <Badge className="bg-emerald-600 text-white">
            Confirmed {new Date(proposal.confirmedAt as string).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="rounded-md border">
        {proposal.buildings.map((b) => (
          <BuildingRow key={b.globalId || b.code} building={b} />
        ))}
        {proposal.buildings.length === 0 && (
          <p className="p-3 text-sm text-zinc-500">The IFC carries no building.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => regenerate.mutate({ versionId })}
          disabled={regenerate.isPending}
        >
          <RefreshCw className="size-4" />
          Regenerate
        </Button>
        <Button
          variant="outline"
          onClick={() => run(false)}
          disabled={confirm.isPending}
        >
          Confirm structure only
        </Button>
        <Button onClick={() => run(true)} disabled={confirm.isPending}>
          {confirmed ? 'Confirm again with elements' : 'Confirm with elements'}
        </Button>
      </div>
    </div>
  );
}

function BuildingRow({ building }: { building: ProposedBimBuilding }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        {building.code} {building.name}
        <MatchBadge matched={!!building.matchedNodeId} />
      </button>
      {open &&
        building.floors.map((f) => <FloorRow key={f.globalId || f.code} floor={f} />)}
    </div>
  );
}

function FloorRow({ floor }: { floor: ProposedBimFloor }) {
  const [open, setOpen] = useState(false);
  const elementCount = floor.zones.reduce((n, z) => n + z.elements.length, 0);
  return (
    <div className="pl-6">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="font-medium">{floor.code}</span>
        <span className="text-zinc-600 dark:text-zinc-400">{floor.name}</span>
        <span className="text-xs text-zinc-500">
          {floor.zones.length} zones · {elementCount} elements
        </span>
        <MatchBadge matched={!!floor.matchedNodeId} />
      </button>
      {open &&
        floor.zones.map((z) => (
          <div key={z.globalId || z.code} className="pl-9 text-sm">
            <div className="flex items-center gap-2 py-1">
              <span className="font-medium">{z.code}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{z.name}</span>
              {z.defaultZone && <span className="text-xs text-zinc-500">(default zone)</span>}
              <span className="text-xs text-zinc-500">{z.elements.length} elements</span>
              <MatchBadge matched={!!z.matchedNodeId} />
            </div>
          </div>
        ))}
    </div>
  );
}

function MatchBadge({ matched }: { matched: boolean }) {
  return matched ? (
    <Badge variant="outline" className="ml-auto text-xs">matched</Badge>
  ) : (
    <Badge variant="secondary" className="ml-auto text-xs">new</Badge>
  );
}
