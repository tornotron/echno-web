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
 * The HTTP status behind a failed tile load, when there is one. three's
 * FileLoader rejects with an `HttpError` carrying the fetch `Response`; a
 * bare `Response` or an error with its own `status` is read the same way.
 */
export function tileErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const own = (error as { status?: unknown }).status;
  if (typeof own === 'number') return own;
  const nested = (error as { response?: { status?: unknown } }).response?.status;
  return typeof nested === 'number' ? nested : undefined;
}

/** Whether the store refused the tile, which for a presigned url means it expired. */
export function isForbidden(error: unknown): boolean {
  return tileErrorStatus(error) === 403;
}

/** One line for the storey row: the status when known, else the error's message. */
export function describeTileError(error: unknown): string {
  const status = tileErrorStatus(error);
  if (status === 403) return 'The tile link expired and could not be refreshed.';
  if (status !== undefined) return `The tile could not be fetched (${status}).`;
  if (error instanceof Error && error.message) return error.message;
  return 'The tile could not be loaded.';
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
  const { data: manifest, isLoading, error, refetch } = useBimTiles(modelId, versionId);
  // Tiles whose load failed, keyed like the selection, with the message to
  // show next to the storey row. A retry clears the entry first.
  const [failed, setFailed] = useState<Map<string, string>>(new Map());
  // Keys whose presigned url was refreshed once already after a 403, so a
  // second refusal is reported rather than refetched forever.
  const refreshedOnce = useRef(new Set<string>());
  // Bumped when a manifest refetch came back with the same object, so the
  // reconcile effect still runs the retry.
  const [retryTick, setRetryTick] = useState(0);
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

  // Reconcile loaded tiles with the selection. Each tile load is guarded on
  // its own: a failure is recorded against its key (rendered by the storey
  // row) instead of surfacing as an unhandled rejection, and the loop moves
  // on to the next storey. A 403 means the presigned url has expired, so the
  // manifest is refetched once and the tile retried on the fresh url; the
  // second refusal is reported (web #457).
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady || !manifest) return;
    let cancelled = false;
    const loaded = new Set(engine.loadedTiles());
    for (const key of loaded) {
      if (!selected.has(key)) engine.unloadTile(key);
    }
    (async () => {
      let refreshManifest = false;
      for (const key of selected) {
        if (loaded.has(key) || failed.has(key)) continue;
        const url = urlFor(key);
        if (!url) continue;
        try {
          await engine.loadTile(key, url);
        } catch (loadError) {
          if (cancelled) return;
          if (isForbidden(loadError) && !refreshedOnce.current.has(key)) {
            refreshedOnce.current.add(key);
            refreshManifest = true;
            continue;
          }
          setFailed((prev) => new Map(prev).set(key, describeTileError(loadError)));
          // The failed map is an effect dependency, so the effect restarts and
          // picks up the remaining keys; carrying on here would load them twice.
          return;
        }
        if (cancelled) return;
        // A tile that loaded may expire again later in the session; let the
        // next 403 on it earn one more refresh.
        refreshedOnce.current.delete(key);
        if (pendingFocus.current && engine.select(pendingFocus.current, true)) {
          pendingFocus.current = undefined;
        }
      }
      if (refreshManifest && !cancelled) {
        const fresh = await refetch();
        if (!cancelled && fresh.data === manifest) setRetryTick((t) => t + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
    // retryTick only re-arms the loop; it is not read inside it.
  }, [selected, manifest, engineReady, urlFor, failed, refetch, retryTick]);

  const retryTile = useCallback((key: string) => {
    refreshedOnce.current.delete(key);
    setFailed((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

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
      className="grid grid-cols-1 gap-3 md:h-[calc(100vh-14rem)] md:min-h-[480px] md:grid-cols-[14rem_1fr] lg:grid-cols-[14rem_1fr_22rem]"
      data-testid="bim-viewer"
    >
      <aside className="max-h-64 min-h-0 overflow-y-auto rounded-md border bg-white md:max-h-none dark:bg-zinc-900">
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
            failed={failed}
            onToggle={toggle}
            onOnly={only}
            onRetry={retryTile}
            className="p-2"
          />
        )}
      </aside>

      <div className="relative h-[60vh] min-h-[320px] overflow-hidden rounded-md border bg-zinc-50 md:h-auto md:min-h-0 dark:bg-zinc-950">
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

      <aside className="max-h-[70vh] min-h-0 overflow-y-auto rounded-md border bg-white md:col-span-2 md:max-h-none md:overflow-hidden lg:col-span-1 dark:bg-zinc-900">
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
