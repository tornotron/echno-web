'use client';

import Link from 'next/link';
import { ClipboardCheck, Eye, ShieldAlert, X } from 'lucide-react';
import type { BimElement } from '@tornotron/echno-core/bim/types';
import { useSpatialNode } from '@tornotron/echno-core/spatial/hooks';
import { useObservations } from '@tornotron/echno-core/inspection/hooks';
import { useInspections } from '@/hooks/inspection';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Skeleton } from '@/components/shadcn/skeleton';
import { SpatialBreadcrumb } from '@/components/shared/spatial-breadcrumb';
import { routes } from '@/nav';

interface ElementPanelProps {
  projectId: number;
  globalId: string;
  element: BimElement | null | undefined;
  isLoading: boolean;
  onClose: () => void;
}

function scalar(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * What a picked element is: its IFC identity and property sets, the spatial
 * node it bridges to, and the inspections, defects and observations recorded
 * against that node.
 */
export function ElementPanel({
  projectId,
  globalId,
  element,
  isLoading,
  onClose,
}: ElementPanelProps) {
  const nodeId = element?.spatialNodeId;
  const { data: node } = useSpatialNode(projectId, nodeId);
  const { data: inspections } = useInspections(
    nodeId ? { projectId, spatialNodeId: nodeId } : undefined
  );
  const { data: observations } = useObservations(
    nodeId ? { projectId, spatialNodeId: nodeId, size: 20 } : undefined
  );
  const inspectionList = nodeId ? (inspections ?? []) : [];
  const defects = inspectionList.flatMap((i) =>
    (i.defects ?? [])
      .filter((d) => !d.spatialNodeId || d.spatialNodeId === nodeId)
      .map((d) => ({ ...d, inspectionId: i.id, inspectionTitle: i.title }))
  );
  const observationList = nodeId ? (observations?.content ?? []) : [];

  const propertySets = Object.entries(element?.properties ?? {});

  return (
    <div className="flex h-full flex-col" data-testid="element-panel" data-global-id={globalId}>
      <div className="flex items-start justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0">
          {isLoading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <div className="truncate font-medium">
              {element?.name || element?.ifcType || 'Element'}
            </div>
          )}
          <div className="truncate font-mono text-xs text-zinc-500">{globalId}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close element panel">
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3 text-sm">
          {element === null && !isLoading && (
            <p className="text-zinc-500">
              This element is in the tile but not in the element table. Re-import the version.
            </p>
          )}

          {element && (
            <section className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{element.ifcType}</Badge>
                {element.retired && <Badge variant="destructive">Retired</Badge>}
              </div>
              {element.storeyGlobalId && (
                <div className="text-xs text-zinc-500">Storey {element.storeyGlobalId}</div>
              )}
            </section>
          )}

          <section className="space-y-1">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Site structure
            </h4>
            {element?.spatialNodeId ? node ? (
              <div data-testid="element-spatial-node">
                <SpatialBreadcrumb path={node.spatialPath} byName />
                <div className="text-xs text-zinc-500">
                  {node.code}
                  {node.elementType ? ` · ${node.elementType}` : ''}
                </div>
              </div>
            ) : (
              <Skeleton className="h-4 w-48" />
            ) : (
              <p className="text-zinc-500">
                Not linked to a site structure node. Confirm the hierarchy proposal to link it.
              </p>
            )}
          </section>

          {element?.spatialNodeId && (
            <>
              <section className="space-y-1">
                <h4 className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <ClipboardCheck className="size-3.5" /> Inspections ({inspectionList.length})
                </h4>
                {inspectionList.length === 0 ? (
                  <p className="text-zinc-500">None on this element.</p>
                ) : (
                  <ul className="space-y-1">
                    {inspectionList.map((i) => (
                      <li key={i.id}>
                        <Link
                          href={routes.inspections.detail(i.id).href}
                          className="text-blue-700 hover:underline dark:text-blue-400"
                        >
                          {i.title}
                        </Link>
                        <span className="ml-1 text-xs text-zinc-500">{i.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="space-y-1">
                <h4 className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <ShieldAlert className="size-3.5" /> Defects ({defects.length})
                </h4>
                {defects.length === 0 ? (
                  <p className="text-zinc-500">None recorded.</p>
                ) : (
                  <ul className="space-y-1">
                    {defects.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={routes.inspections.detail(d.inspectionId).href}
                          className="text-blue-700 hover:underline dark:text-blue-400"
                        >
                          {d.description}
                        </Link>
                        <span className="ml-1 text-xs text-zinc-500">{d.severity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="space-y-1">
                <h4 className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <Eye className="size-3.5" /> Observations ({observationList.length})
                </h4>
                {observationList.length === 0 ? (
                  <p className="text-zinc-500">None recorded.</p>
                ) : (
                  <ul className="space-y-1">
                    {observationList.map((o) => (
                      <li key={o.id}>
                        {o.title}
                        <span className="ml-1 text-xs text-zinc-500">{o.reviewStatus}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          <section className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Properties
            </h4>
            {propertySets.length === 0 ? (
              <p className="text-zinc-500">No property sets.</p>
            ) : (
              propertySets.map(([pset, values]) => (
                <div key={pset} data-testid="property-set">
                  <div className="text-xs font-medium">{pset}</div>
                  {values && typeof values === 'object' ? (
                    <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
                      {Object.entries(values as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="truncate text-zinc-500">{k}</dt>
                          <dd className="text-right">{scalar(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="text-xs">{scalar(values)}</div>
                  )}
                </div>
              ))
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
