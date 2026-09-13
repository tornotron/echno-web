'use client';

import Link from 'next/link';
import { Box } from 'lucide-react';
import { useSpatialNode } from '@tornotron/echno-core/spatial/hooks';
import { useEnabledModuleIds } from '@/hooks/use-enabled-module-ids';
import { bimViewerHref } from '@/lib/bim/show-in-model-href';
import { cn } from '@/lib/utils/index';

interface ShowInModelLinkProps {
  projectId: number | undefined;
  spatialNodeId: string | undefined;
  className?: string;
}

/**
 * "Show in model" from an inspection, defect or observation: opens the
 * project's BIM viewer focused on the element behind its spatial node.
 * Renders nothing when the org has no BIM module, the entity has no node, or
 * the node carries no IFC GlobalId (a hierarchy built by hand or not yet
 * confirmed from a model).
 */
export function ShowInModelLink({
  projectId,
  spatialNodeId,
  className,
}: ShowInModelLinkProps) {
  const { moduleIds } = useEnabledModuleIds();
  const enabled = moduleIds?.has('bim') ?? false;
  const { data: node } = useSpatialNode(
    enabled ? projectId : undefined,
    enabled ? spatialNodeId : undefined
  );
  const guid = node?.bimElementGuid;
  if (!enabled || !projectId || !guid) return null;
  return (
    <Link
      href={bimViewerHref(projectId, { element: guid })}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-blue-700 hover:underline dark:text-blue-400',
        className
      )}
      data-testid="show-in-model-link"
    >
      <Box className="size-3.5" />
      Show in model
    </Link>
  );
}
