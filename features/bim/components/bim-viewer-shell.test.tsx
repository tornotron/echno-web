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
import { createElement, type ReactNode } from 'react';
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
mock.module('@tornotron/echno-core/bim/hooks', () => ({
  ...realBimHooks,
  useBimTiles: () => ({ data: manifest, isLoading: false, error: null }),
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

function recorder(): Recorder {
  const handlers = new Set<(id: string | undefined) => void>();
  const loaded = new Set<string>();
  const engine: Recorder = {
    loads: [],
    unloads: [],
    selections: [],
    pick: (id) => { for (const h of handlers) h(id) },
    async loadTile(key, url) {
      loaded.add(key);
      engine.loads.push({ key, url });
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
});

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

  test('opening with a focus element loads its storey and frames it once the tile is in', async () => {
    const engine = recorder();
    renderShell(engine, { initialElement: element.globalId });
    await waitFor(() => expect(engine.loads.map((l) => l.key)).toContain('S1'));
    await waitFor(() => expect(engine.selections).toContain(element.globalId));
  });
});
