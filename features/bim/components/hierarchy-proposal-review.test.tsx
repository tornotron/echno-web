/**
 * Who gets the hierarchy write buttons (web #456): regenerate and confirm are
 * accepted by the backend from managers and above only, so a member sees the
 * proposal but not buttons that would end in a 403 toast.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import * as realBimHooks from '@tornotron/echno-core/bim/hooks';
import * as realSpatialHooks from '@tornotron/echno-core/spatial/hooks';

const MODEL = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';

const proposal = {
  modelId: MODEL,
  versionId: VERSION,
  generatedAt: 'now',
  counts: { buildings: 1, floors: 1, zones: 1, elements: 3 },
  buildings: [
    {
      globalId: 'B1',
      code: 'B1',
      name: 'Block B',
      floors: [{ globalId: 'F1', code: 'L01', name: 'Level 1', zones: [] }],
    },
  ],
};

const mutation = () => ({ mutate: () => {}, isPending: false });
mock.module('@tornotron/echno-core/bim/hooks', () => ({
  ...realBimHooks,
  useBimHierarchyProposal: () => ({ data: proposal, isLoading: false }),
  useRegenerateBimHierarchyProposal: mutation,
  useConfirmBimHierarchy: mutation,
}));

// The project's tree as the site team built it since the proposal was
// stored: Block B was imported from CSV with the IFC's GlobalId on it.
let tree: unknown[] = [];
mock.module('@tornotron/echno-core/spatial/hooks', () => ({
  ...realSpatialHooks,
  useSpatialTree: () => ({ data: tree, isLoading: false }),
}));

let isManagerOrAbove = true;
mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => ({ isManagerOrAbove, isLoading: false }),
}));

const { HierarchyProposalReview } = await import('./hierarchy-proposal-review');

function renderReview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(HierarchyProposalReview, { projectId: 7, modelId: MODEL, versionId: VERSION })
    )
  );
}

afterEach(() => {
  cleanup();
  isManagerOrAbove = true;
  tree = [];
});

describe('HierarchyProposalReview', () => {
  // web #463: the stored proposal says "new" for every node, but confirm
  // matches by GlobalId against the current tree, so the preview must too.
  test('a node whose GlobalId is already in the project tree is labelled matched', () => {
    tree = [
      {
        id: 'n-b1',
        projectId: 7,
        level: 'BUILDING',
        code: 'B1',
        name: 'Block B',
        bimElementGuid: 'B1',
        children: [],
      },
    ];
    const view = renderReview();
    const rows = view.getByTestId('hierarchy-proposal');
    const buildingButton = [...rows.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Block B')
    );
    expect(buildingButton?.textContent).toContain('matched');
    expect(buildingButton?.textContent).not.toContain('new');
    const floorButton = [...rows.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Level 1')
    );
    expect(floorButton?.textContent).toContain('new');
    expect(rows.textContent).toContain('1 matched');
  });

  test('with no tree match the stored labels stand', () => {
    const view = renderReview();
    const rows = view.getByTestId('hierarchy-proposal');
    expect(rows.textContent).not.toContain('matched');
  });

  test('a manager sees the regenerate and confirm buttons', () => {
    const view = renderReview();
    expect(view.getByTestId('hierarchy-proposal-actions').textContent).toContain('Regenerate');
    expect(view.getByTestId('hierarchy-proposal-actions').textContent).toContain('Confirm with elements');
  });

  test('a member sees the proposal but none of the write buttons', () => {
    isManagerOrAbove = false;
    const view = renderReview();
    expect(view.getByTestId('hierarchy-proposal').textContent).toContain('Block B');
    expect(view.queryByTestId('hierarchy-proposal-actions')).toBeNull();
    expect(view.queryByText(/Regenerate/)).toBeNull();
    expect(view.queryByText(/Confirm/)).toBeNull();
  });
});
