'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Scissors } from 'lucide-react';
import {
  useBimElementByGlobalId,
  useBimTiles,
} from '@tornotron/echno-core/bim/hooks';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import type { CreateViewerEngine, ViewerEngine } from '../lib/viewer-engine';
import { ElementPanel } from './element-panel';
import { StoreyNavigator, UNASSIGNED_KEY } from './storey-navigator';

export interface BimViewerShellProps {
  projectId: number;
  modelId: string;
  versionId: string;
  /** GlobalId to focus on open (the "show in model" target). */
  initialElement?: string;
  /** Its storey, when the caller knows it; saves the element lookup's paging. */
  initialStorey?: string;
  /**
   * Engine factory. Defaults to the three.js engine, loaded on demand so it
   * stays out of the main chunk; tests inject a fake.
   */
  createEngine?: CreateViewerEngine;
}

async function defaultEngine(): Promise<CreateViewerEngine> {
  const mod = await import('../lib/viewer-engine');
  return mod.createViewerEngine;
}

/**
 * The viewer: storey navigator on the left, canvas in the middle, element
 * panel on the right. Loads one presigned tile per selected storey and
 * resolves a picked GlobalId to its element row.
 */
export function BimViewerShell({
  projectId,
  modelId,
  versionId,
  initialElement,
  initialStorey,
  createEngine,
}: BimViewerShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ViewerEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const { data: manifest, isLoading, error } = useBimTiles(modelId, versionId);
  const [selection, setSelection] = useState<{ manifestId?: string; keys: Set<string> }>({
    keys: new Set(initialStorey ? [initialStorey] : []),
  });
  const [picked, setPicked] = useState<string | undefined>(initialElement);
  const [pickedStorey, setPickedStorey] = useState<string | undefined>(initialStorey);
  const pendingFocus = useRef<string | undefined>(initialElement);

  // Initial storey: the focus target's storey when known, else the lowest
  // storey (the first the manifest lists). Derived during render, keyed on
  // the manifest, so a later manifest refresh does not reset the user's pick.
  const manifestId = manifest ? `${manifest.modelId}/${manifest.versionId}` : undefined;
  const selected = useMemo(() => {
    if (selection.manifestId === manifestId || !manifest) return selection.keys;
    if (selection.keys.size > 0) return selection.keys;
    const first = manifest.storeys[0]?.globalId;
    return new Set(first ? [first] : []);
  }, [selection, manifest, manifestId]);
  const setSelected = useCallback(
    (update: Set<string> | ((prev: Set<string>) => Set<string>)) =>
      setSelection((prev) => ({
        manifestId,
        keys: typeof update === 'function' ? update(prev.keys.size > 0 ? prev.keys : selected) : update,
      })),
    [manifestId, selected]
  );

  const {
    data: element,
    isLoading: elementLoading,
  } = useBimElementByGlobalId(modelId, picked, pickedStorey);

  // Mount the engine once the container exists.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let engine: ViewerEngine | undefined;
    (async () => {
      const factory = createEngine ?? (await defaultEngine());
      if (disposed) return;
      engine = factory(container);
      engineRef.current = engine;
      setEngineReady(true);
    })();
    return () => {
      disposed = true;
      engine?.dispose();
      engineRef.current = null;
      setEngineReady(false);
    };
  }, [createEngine]);

  // Route picks into state.
  useEffect(() => {
    if (!engineReady) return;
    const engine = engineRef.current;
    if (!engine) return;
    return engine.onPick((globalId) => {
      setPicked(globalId);
      setPickedStorey(undefined);
      engine.select(globalId, false);
    });
  }, [engineReady]);

  // Once the focus element resolves, make sure its storey is loaded.
  useEffect(() => {
    if (!pendingFocus.current || !element) return;
    const storey = element.storeyGlobalId ?? UNASSIGNED_KEY;
    setPickedStorey(element.storeyGlobalId);
    setSelected((prev) => (prev.has(storey) ? prev : new Set([...prev, storey])));
  }, [element, setSelected]);

  const urlFor = useCallback(
    (key: string): string | undefined => {
      if (!manifest) return undefined;
      if (key === UNASSIGNED_KEY) return manifest.unassignedUrl;
      return manifest.storeys.find((s) => s.globalId === key)?.url;
    },
    [manifest]
  );

  // Reconcile loaded tiles with the selection.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady || !manifest) return;
    let cancelled = false;
    const loaded = new Set(engine.loadedTiles());
    for (const key of loaded) {
      if (!selected.has(key)) engine.unloadTile(key);
    }
    (async () => {
      for (const key of selected) {
        if (loaded.has(key)) continue;
        const url = urlFor(key);
        if (!url) continue;
        await engine.loadTile(key, url);
        if (cancelled) return;
        if (pendingFocus.current && engine.select(pendingFocus.current, true)) {
          pendingFocus.current = undefined;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, manifest, engineReady, urlFor]);

  const toggle = useCallback((key: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, [setSelected]);
  const only = useCallback((key: string) => setSelected(new Set([key])), [setSelected]);

  const closePanel = useCallback(() => {
    setPicked(undefined);
    engineRef.current?.select(undefined);
  }, []);

  const hasUnassigned = useMemo(() => !!manifest?.unassignedUrl, [manifest]);

  return (
    <div
      className="grid h-[calc(100vh-14rem)] min-h-[480px] grid-cols-1 gap-3 md:grid-cols-[14rem_1fr] lg:grid-cols-[14rem_1fr_22rem]"
      data-testid="bim-viewer"
    >
      <aside className="overflow-y-auto rounded-md border bg-white dark:bg-zinc-900">
        {isLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <StoreyNavigator
            storeys={manifest?.storeys ?? []}
            hasUnassigned={hasUnassigned}
            selected={selected}
            onToggle={toggle}
            onOnly={only}
            className="p-2"
          />
        )}
      </aside>

      <div className="relative min-h-[320px] overflow-hidden rounded-md border bg-zinc-50 dark:bg-zinc-950">
        <div ref={containerRef} className="absolute inset-0" data-testid="bim-canvas" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-sm text-red-700">
            Could not load the tile manifest. {error.message}
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => engineRef.current?.fitAll()}
            aria-label="Fit model"
          >
            <Maximize2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => engineRef.current?.toggleSectionPlane()}
            aria-label="Toggle section plane"
            title="Section plane at the last click; click again to clear"
          >
            <Scissors className="size-4" />
          </Button>
        </div>
      </div>

      <aside className="overflow-hidden rounded-md border bg-white dark:bg-zinc-900">
        {picked ? (
          <ElementPanel
            projectId={projectId}
            globalId={picked}
            element={element}
            isLoading={elementLoading}
            onClose={closePanel}
          />
        ) : (
          <div className="p-3 text-sm text-zinc-500">
            Click an element to see its properties, site structure link and inspections.
          </div>
        )}
      </aside>
    </div>
  );
}

export default BimViewerShell;
