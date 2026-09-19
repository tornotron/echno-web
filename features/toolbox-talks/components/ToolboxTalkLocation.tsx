'use client';

import { useSpatialNode } from '@tornotron/echno-core/spatial/hooks';
import { SpatialBreadcrumb } from '@/components/shared/spatial-breadcrumb';

interface ToolboxTalkLocationProps {
  projectId: number | undefined;
  spatialNodeId: string | undefined;
  className?: string;
}

/**
 * The floor or zone a talk was held at, as a breadcrumb. A talk carries only
 * the node id, so the path is looked up; nothing renders while it loads or
 * when no node was chosen.
 */
export function ToolboxTalkLocation({
  projectId,
  spatialNodeId,
  className,
}: ToolboxTalkLocationProps) {
  const { data: node } = useSpatialNode(projectId, spatialNodeId);
  if (!spatialNodeId)
    return <span className="text-muted-foreground">Whole site</span>;
  if (!node) return null;
  return (
    <SpatialBreadcrumb path={node.spatialPath} byName className={className} />
  );
}
