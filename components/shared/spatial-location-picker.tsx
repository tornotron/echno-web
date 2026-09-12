'use client';

import { useMemo } from 'react';
import type {
  SpatialLevel,
  SpatialTreeNode,
} from '@tornotron/echno-core/spatial/types';
import { spatialLevelLabels } from '@tornotron/echno-core/spatial/types';
import { useSpatialTree } from '@tornotron/echno-core/spatial/hooks';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils/index';

interface SpatialLocationPickerProps {
  projectId: number | undefined;
  /** The selected node id at any level, or undefined for none. */
  value: string | undefined;
  onChange: (nodeId: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

const LEVELS: readonly SpatialLevel[] = [
  'BUILDING',
  'FLOOR',
  'ZONE',
  'ELEMENT',
];

function findPath(
  nodes: readonly SpatialTreeNode[],
  id: string,
  trail: SpatialTreeNode[] = []
): SpatialTreeNode[] | undefined {
  for (const node of nodes) {
    const next = [...trail, node];
    if (node.id === id) return next;
    const found = findPath(node.children, id, next);
    if (found) return found;
  }
  return undefined;
}

const SELECT_CLASS =
  'border-input bg-background h-9 w-full rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Cascading `Building > Floor > Zone > Element` selects over a project's site
 * structure. Each level below the first is optional: picking a building and
 * stopping there writes the building's id. Archived nodes are not offered,
 * except the one already selected, so an old reference still displays.
 */
export function SpatialLocationPicker({
  projectId,
  value,
  onChange,
  disabled = false,
  className,
}: SpatialLocationPickerProps) {
  const { data: tree = [], isPending } = useSpatialTree(projectId, true);

  const selectedTrail = useMemo(
    () => (value ? (findPath(tree, value) ?? []) : []),
    [tree, value]
  );

  if (projectId === undefined) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a project to pick a site location.
      </p>
    );
  }
  if (!isPending && tree.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This project has no site structure yet. Add buildings and floors under
        the project&apos;s Site structure tab, or type a location note below.
      </p>
    );
  }

  const columns = LEVELS.map((level, depth) => {
    const parent = depth === 0 ? undefined : selectedTrail[depth - 1];
    const options =
      depth === 0 ? tree : parent ? parent.children : ([] as SpatialTreeNode[]);
    const selected = selectedTrail[depth];
    const visible = options.filter(
      (n) => !n.archivedAt || n.id === selected?.id
    );
    return { level, depth, options: visible, selected, parent };
  });

  const pick = (depth: number, id: string) => {
    if (id === '') {
      // Clearing a level falls back to the level above it.
      const above = selectedTrail[depth - 1];
      onChange(above?.id);
      return;
    }
    onChange(id);
  };

  return (
    <div
      data-testid="spatial-location-picker"
      className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}
    >
      {columns.map(({ level, depth, options, selected, parent }) => {
        const enabled =
          !disabled &&
          (depth === 0 || parent !== undefined) &&
          options.length > 0;
        const id = `spatial-${level.toLowerCase()}`;
        return (
          <div key={level} className="space-y-1.5">
            <Label htmlFor={id}>{spatialLevelLabels[level]}</Label>
            <select
              id={id}
              aria-label={spatialLevelLabels[level]}
              className={SELECT_CLASS}
              disabled={!enabled}
              value={selected?.id ?? ''}
              onChange={(e) => pick(depth, e.target.value)}
            >
              <option value="">
                {depth === 0 ? 'None' : parent ? 'Any' : ''}
              </option>
              {options.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.code}
                  {node.name && node.name !== node.code
                    ? ` · ${node.name}`
                    : ''}
                  {node.archivedAt ? ' (archived)' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
