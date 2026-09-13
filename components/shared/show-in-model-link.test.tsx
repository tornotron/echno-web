/**
 * "Show in model" (web #445): present only when the org has the BIM module
 * and the spatial node carries an IFC GlobalId; the href focuses that
 * element in the project's viewer.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { cleanup, render } from '@testing-library/react';
import * as realSpatialHooks from '@tornotron/echno-core/spatial/hooks';

// Stubbed one level down, at core's `useEnabledModules`, the way
// `module-guard.test.tsx` does: bun's `mock.module` is process-wide, and a
// stub of `@/hooks/use-enabled-module-ids` itself would leak into that test.
let modules: Set<string> | undefined = new Set(['inspections', 'bim']);
const guidByNode: Record<string, string | undefined> = { n1: '2O2Fr$t4X7Zf8NOew3FLKI', n2: undefined };

mock.module('@tornotron/echno-core/module/hooks', () => ({
  useEnabledModules: () => ({
    data: modules ? [...modules].map((id) => ({ id })) : undefined,
    isError: false,
    isLoading: false,
  }),
}));
mock.module('@tornotron/echno-core/spatial/hooks', () => ({
  ...realSpatialHooks,
  useSpatialNode: (projectId?: number, nodeId?: string) => ({
    data:
      projectId && nodeId
        ? { id: nodeId, level: 'ELEMENT', code: 'C4', name: 'C4', sortOrder: 0, depth: 3, spatialPath: [], bimElementGuid: guidByNode[nodeId] }
        : undefined,
  }),
}));
mock.module('next/link', () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) =>
    createElement('a', { href, ...rest }, children),
}));

const { ShowInModelLink } = await import('./show-in-model-link');
const { bimViewerHref } = await import('@/lib/bim/show-in-model-href');

afterEach(() => {
  cleanup();
  modules = new Set(['inspections', 'bim']);
});

describe('ShowInModelLink', () => {
  test('links to the viewer focused on the node\'s element', () => {
    const view = render(createElement(ShowInModelLink, { projectId: 7, spatialNodeId: 'n1' }));
    const link = view.getByTestId('show-in-model-link');
    expect(link.getAttribute('href')).toBe(
      '/users/dashboard/projects/all-projects/7/bim?element=2O2Fr%24t4X7Zf8NOew3FLKI'
    );
  });

  test('hidden when the org has no BIM module', () => {
    modules = new Set(['inspections']);
    const view = render(createElement(ShowInModelLink, { projectId: 7, spatialNodeId: 'n1' }));
    expect(view.queryByTestId('show-in-model-link')).toBeNull();
  });

  test('hidden when the node has no element, or there is no node at all', () => {
    const noGuid = render(createElement(ShowInModelLink, { projectId: 7, spatialNodeId: 'n2' }));
    expect(noGuid.queryByTestId('show-in-model-link')).toBeNull();
    cleanup();
    const noNode = render(createElement(ShowInModelLink, { projectId: 7, spatialNodeId: undefined }));
    expect(noNode.queryByTestId('show-in-model-link')).toBeNull();
  });

  test('the href builder carries model, element and storey', () => {
    expect(bimViewerHref(3)).toBe('/users/dashboard/projects/all-projects/3/bim');
    expect(bimViewerHref(3, { model: 'm', element: 'e', storey: 's' })).toBe(
      '/users/dashboard/projects/all-projects/3/bim?model=m&element=e&storey=s'
    );
  });
});
