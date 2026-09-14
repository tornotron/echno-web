/**
 * The viewer shell (web #444). Fails without the code: `features/bim` does
 * not exist on `development`.
 *
 * The three.js engine is replaced by a recorder, so the test asserts the
 * contract between the shell and the engine: the storeys the manifest lists
 * are offered, the selected storey's presigned url is the one requested, and
 * a pick opens the element panel with the row the GlobalId resolved to.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import * as realBimHooks from '@tornotron/echno-core/bim/hooks';
import * as realSpatialHooks from '@tornotron/echno-core/spatial/hooks';
import * as realInspectionHooks from '@tornotron/echno-core/inspection/hooks';
import * as realWebInspectionHooks from '@/hooks/inspection';
import type { ViewerEngine } from '../lib/viewer-engine';

const MODEL = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const NODE = '66666666-6666-6666-6666-666666666666';

const manifest = {
  modelId: MODEL,
  versionId: VERSION,
  coarseUrl: 'https://store/coarse.glb?sig',
  unassignedUrl: 'https://store/unassigned.glb?sig',
  expiresInSeconds: 900,
  storeys: [
    { globalId: 'S0', name: 'Ground', elevation: 0, elementCount: 12, url: 'https://store/S0.glb?sig' },
    { globalId: 'S1', name: 'Level 1', elevation: 3.3, elementCount: 9, url: 'https://store/S1.glb?sig' },
  ],
};

const element = {
  id: '55555555-5555-5555-5555-555555555555',
  modelId: MODEL,
  globalId: '2O2Fr$t4X7Zf8NOew3FLKI',
  ifcType: 'IfcColumn',
  name: 'Column C4',
  storeyGlobalId: 'S1',
  properties: { Pset_ColumnCommon: { LoadBearing: true, Reference: 'C4' } },
  spatialNodeId: NODE,
  retired: false,
};

let lookedUp: string | undefined;
let manifestRefetches = 0;
/** A refetch hands back the same storeys with re-signed urls. */
function resignedManifest(generation: number) {
  const sig = `sig${generation}`;
  return {
    ...manifest,
    unassignedUrl: `https://store/unassigned.glb?${sig}`,
    storeys: manifest.storeys.map((s) => ({ ...s, url: s.url.replace('sig', sig) })),
  };
}
mock.module('@tornotron/echno-core/bim/hooks', () => ({
  ...realBimHooks,
  // Stateful so a `refetch` re-renders the shell with fresh urls, the way
  // TanStack would after the manifest query settles again.
  useBimTiles: () => {
    const [data, setData] = useState(manifest);
    return {
      data,
      isLoading: false,
      error: null,
      refetch: async () => {
        manifestRefetches += 1;
        const next = resignedManifest(manifestRefetches + 1);
        setData(next);
        return { data: next };
      },
    };
  },
  useBimElementByGlobalId: (_m: string, globalId?: string) => {
    lookedUp = globalId;
    return { data: globalId === element.globalId ? element : null, isLoading: false };
  },
}));
mock.module('@tornotron/echno-core/spatial/hooks', () => ({
  ...realSpatialHooks,
  useSpatialNode: (_p?: number, nodeId?: string) => ({
    data:
      nodeId === NODE
        ? {
            id: NODE,
            level: 'ELEMENT',
            code: 'C4',
            name: 'Column C4',
            elementType: 'column',
            sortOrder: 0,
            depth: 3,
            spatialPath: [
              { id: 'b', level: 'BUILDING', code: 'B1', name: 'Block B' },
              { id: 'f', level: 'FLOOR', code: 'L01', name: 'Level 1' },
              { id: 'z', level: 'ZONE', code: 'Z1', name: 'Zone 1' },
              { id: NODE, level: 'ELEMENT', code: 'C4', name: 'Column C4' },
            ],
          }
        : undefined,
  }),
}));
mock.module('@tornotron/echno-core/inspection/hooks', () => ({
  ...realInspectionHooks,
  useObservations: () => ({ data: { content: [], totalElements: 0, totalPages: 0, number: 0 } }),
}));
mock.module('@/hooks/inspection', () => ({
  ...realWebInspectionHooks,
  useInspections: (params?: { spatialNodeId?: string }) => ({
    data: params?.spatialNodeId
      ? [
          {
            id: 'insp-1',
            title: 'Column pour check',
            status: 'completed',
            defects: [{ id: 'd1', description: 'Honeycombing', severity: 'major', spatialNodeId: NODE }],
          },
        ]
      : [],
  }),
}));
mock.module('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { BimViewerShell } = await import('./bim-viewer-shell');

interface Recorder extends ViewerEngine {
  loads: { key: string; url: string }[];
  unloads: string[];
  selections: (string | undefined)[];
  pick: (globalId: string | undefined) => void;
}

/** What a tile load throws for a given url; `undefined` means the load succeeds. */
type Refusal = (url: string) => unknown;

function recorder(refuse: Refusal = () => {}): Recorder {
  const handlers = new Set<(id: string | undefined) => void>();
  const loaded = new Set<string>();
  const engine: Recorder = {
    loads: [],
    unloads: [],
    selections: [],
    pick: (id) => { for (const h of handlers) h(id) },
    async loadTile(key, url) {
      engine.loads.push({ key, url });
      const refusal = refuse(url);
      if (refusal !== undefined) throw refusal;
      loaded.add(key);
    },
    unloadTile(key) {
      loaded.delete(key);
      engine.unloads.push(key);
    },
    loadedTiles: () => [...loaded],
    setTileVisible() {},
    onPick(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    select(globalId) {
      engine.selections.push(globalId);
      return loaded.size > 0;
    },
    fitAll() {},
    toggleSectionPlane() {},
    clearSectionPlanes() {},
    dispose() {},
  };
  return engine;
}

// The default engine is the on-demand three.js import, an async step the
// shell sits through with an empty canvas; a recorder stands in for three so
// the shell can be observed between mount and the engine being ready
// (web #463).
const defaultEngineRecorder = recorder();
let defaultEngineCreated = 0;
mock.module('../lib/viewer-engine', () => ({
  createViewerEngine: () => {
    defaultEngineCreated += 1;
    return defaultEngineRecorder;
  },
}));

function renderShell(engine: Recorder, props: Partial<Parameters<typeof BimViewerShell>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(BimViewerShell, {
        projectId: 7,
        modelId: MODEL,
        versionId: VERSION,
        createEngine: () => engine,
        ...props,
      })
    )
  );
}

afterEach(() => {
  cleanup();
  lookedUp = undefined;
  manifestRefetches = 0;
});

function storeyRow(view: ReturnType<typeof renderShell>, key: string) {
  return view.getAllByTestId('storey-row').find((r) => r.dataset.storey === key) as HTMLElement;
}

describe('BimViewerShell', () => {
  test('lists the storeys from the manifest and loads the lowest one by default', async () => {
    const engine = recorder();
    const view = renderShell(engine);
    const rows = view.getAllByTestId('storey-row').map((r) => r.dataset.storey);
    // Top down, the unassigned tile last.
    expect(rows).toEqual(['S1', 'S0', '__unassigned__']);
    await waitFor(() => expect(engine.loads).toHaveLength(1));
    expect(engine.loads[0]).toEqual({ key: 'S0', url: 'https://store/S0.glb?sig' });
  });

  test('toggling a storey requests its presigned tile and unloads the one turned off', async () => {
    const engine = recorder();
    const view = renderShell(engine);
    await waitFor(() => expect(engine.loads).toHaveLength(1));
    const level1 = view.getAllByTestId('storey-row').find((r) => r.dataset.storey === 'S1');
    const onlyButton = level1?.querySelector('button[title="Show only this storey"]');
    expect(onlyButton).not.toBeNull();
    fireEvent.click(onlyButton as Element);
    await waitFor(() => expect(engine.loads).toHaveLength(2));
    expect(engine.loads[1]).toEqual({ key: 'S1', url: 'https://store/S1.glb?sig' });
    expect(engine.unloads).toEqual(['S0']);
  });

  test('a pick resolves the GlobalId and opens the element panel with properties and the node', async () => {
    const engine = recorder();
    const view = renderShell(engine);
    await waitFor(() => expect(engine.loads).toHaveLength(1));
    expect(view.queryByTestId('element-panel')).toBeNull();
    act(() => engine.pick(element.globalId));
    const panel = await view.findByTestId('element-panel');
    expect(panel.dataset.globalId).toBe(element.globalId);
    expect(lookedUp).toBe(element.globalId);
    expect(panel.textContent).toContain('Column C4');
    expect(panel.textContent).toContain('IfcColumn');
    expect(panel.textContent).toContain('Pset_ColumnCommon');
    expect(panel.textContent).toContain('LoadBearing');
    expect(view.getByTestId('element-spatial-node').textContent).toContain('Zone 1');
    expect(panel.textContent).toContain('Column pour check');
    expect(panel.textContent).toContain('Honeycombing');
    expect(engine.selections).toContain(element.globalId);
  });

  test('a tile that fails to load is reported on its storey row and not retried on a loop', async () => {
    const engine = recorder((url) => (url.includes('S0') ? new Error('bad glTF') : undefined));
    const view = renderShell(engine);
    await waitFor(() => expect(storeyRow(view, 'S0').dataset.error).toBe('true'));
    expect(storeyRow(view, 'S0').textContent).toContain('bad glTF');
    expect(storeyRow(view, 'S1').dataset.error).toBeUndefined();
    // No refetch for a plain failure, and the failed key is left alone until
    // the person retries it.
    expect(manifestRefetches).toBe(0);
    await new Promise((r) => setTimeout(r, 50));
    expect(engine.loads.filter((l) => l.key === 'S0')).toHaveLength(1);
  });

  test('a 403 refreshes the manifest and retries the tile once on the re-signed url', async () => {
    const engine = recorder((url) => (url.endsWith('?sig') ? { status: 403 } : undefined));
    const view = renderShell(engine);
    await waitFor(() => expect(engine.loads).toHaveLength(2));
    expect(engine.loads.map((l) => l.url)).toEqual([
      'https://store/S0.glb?sig',
      'https://store/S0.glb?sig2',
    ]);
    expect(manifestRefetches).toBe(1);
    expect(storeyRow(view, 'S0').dataset.error).toBeUndefined();
  });

  test('a second 403 after the refresh is reported instead of refetching again', async () => {
    const engine = recorder(() => ({ status: 403 }));
    const view = renderShell(engine);
    await waitFor(() => expect(storeyRow(view, 'S0').dataset.error).toBe('true'));
    expect(storeyRow(view, 'S0').textContent).toContain('expired');
    expect(manifestRefetches).toBe(1);
    expect(engine.loads).toHaveLength(2);
  });

  test('retry on a failed row clears the error and asks for the tile again', async () => {
    let refusals = 0;
    const engine = recorder((url) => {
      if (!url.includes('S0')) return;
      refusals += 1;
      return refusals === 1 ? new Error('bad glTF') : undefined;
    });
    const view = renderShell(engine);
    await waitFor(() => expect(storeyRow(view, 'S0').dataset.error).toBe('true'));
    const retry = storeyRow(view, 'S0').querySelector('button[title="Try loading this storey again"]');
    expect(retry).not.toBeNull();
    fireEvent.click(retry as Element);
    await waitFor(() => expect(engine.loads.filter((l) => l.key === 'S0')).toHaveLength(2));
    await waitFor(() => expect(storeyRow(view, 'S0').dataset.error).toBeUndefined());
  });

  test('opening with a focus element loads its storey and frames it once the tile is in', async () => {
    const engine = recorder();
    renderShell(engine, { initialElement: element.globalId });
    await waitFor(() => expect(engine.loads.map((l) => l.key)).toContain('S1'));
    await waitFor(() => expect(engine.selections).toContain(element.globalId));
  });

  test('the canvas shows a loading state until the engine is ready', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(BimViewerShell, { projectId: 7, modelId: MODEL, versionId: VERSION })
      )
    );
    const loading = view.getByTestId('bim-canvas-loading');
    expect(loading.textContent).toContain('Loading the 3D viewer');
    // The engine import settles on a later tick; flush it inside act rather
    // than through waitFor, which holds the act scope open around it.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(defaultEngineCreated).toBe(1);
    expect(view.queryByTestId('bim-canvas-loading')).toBeNull();
  });
});
