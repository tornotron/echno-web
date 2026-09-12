import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type {
  SpatialPathSegment,
  SpatialTreeNode,
} from '@tornotron/echno-core/spatial/types';

const B1 = '6a1f3c1e-0d4e-4f5a-9b2c-1d2e3f4a5b6c';
const L03 = '7b2f3c1e-0d4e-4f5a-9b2c-1d2e3f4a5b6d';
const Z1 = '8c3f3c1e-0d4e-4f5a-9b2c-1d2e3f4a5b6e';
const C4 = '9d4f3c1e-0d4e-4f5a-9b2c-1d2e3f4a5b6f';

function node(
  partial: Partial<SpatialTreeNode> & Pick<SpatialTreeNode, 'id' | 'level' | 'code'>
): SpatialTreeNode {
  return { name: partial.code, sortOrder: 0, children: [], ...partial };
}

const tree: SpatialTreeNode[] = [
  node({
    id: B1,
    level: 'BUILDING',
    code: 'B1',
    name: 'Block B',
    children: [
      node({
        id: L03,
        level: 'FLOOR',
        code: 'L03',
        levelIndex: 3,
        parentId: B1,
        children: [
          node({
            id: Z1,
            level: 'ZONE',
            code: 'Z1',
            parentId: L03,
            children: [node({ id: C4, level: 'ELEMENT', code: 'C4', parentId: Z1, elementType: 'column' })],
          }),
        ],
      }),
    ],
  }),
];

const mutate = mock((..._args: unknown[]) => {});
const mutation = () => ({ mutate, isPending: false });
const useSpatialTree = mock((_projectId: number | undefined, _includeArchived?: boolean) => ({
  data: tree,
  isPending: false,
  error: null,
}));

mock.module('@tornotron/echno-core/spatial/hooks', () => ({
  useSpatialTree,
  useSpatialNode: () => ({ data: undefined, isPending: false }),
  useCreateSpatialNode: mutation,
  useUpdateSpatialNode: mutation,
  useMoveSpatialNode: mutation,
  useArchiveSpatialNode: mutation,
  useRestoreSpatialNode: mutation,
  useImportSpatialRows: mutation,
}));
mock.module('@/lib/styles/toast-styles', () => ({
  toast: { success: mock(() => {}), error: mock(() => {}), info: mock(() => {}), warning: mock(() => {}) },
}));

const { SiteStructureTab } = await import('./index');
const { SpatialLocationPicker } = await import(
  '@/components/shared/spatial-location-picker'
);
const { SpatialBreadcrumb } = await import('@/components/shared/spatial-breadcrumb');

afterEach(() => {
  cleanup();
  mutate.mockClear();
});

describe('SpatialLocationPicker', () => {
  test('cascades building to floor to zone and writes the picked node id', () => {
    const onChange = mock((_id: string | undefined) => {});
    const { getByLabelText, rerender } = render(
      createElement(SpatialLocationPicker, { projectId: 12, value: undefined, onChange })
    );
    const floor = getByLabelText('Floor') as HTMLSelectElement;
    expect(floor.disabled).toBe(true);

    fireEvent.change(getByLabelText('Building'), { target: { value: B1 } });
    expect(onChange).toHaveBeenLastCalledWith(B1);

    rerender(createElement(SpatialLocationPicker, { projectId: 12, value: B1, onChange }));
    expect((getByLabelText('Floor') as HTMLSelectElement).disabled).toBe(false);
    fireEvent.change(getByLabelText('Floor'), { target: { value: L03 } });
    expect(onChange).toHaveBeenLastCalledWith(L03);

    rerender(createElement(SpatialLocationPicker, { projectId: 12, value: L03, onChange }));
    fireEvent.change(getByLabelText('Zone'), { target: { value: Z1 } });
    expect(onChange).toHaveBeenLastCalledWith(Z1);
  });

  test('an existing pick shows its whole trail, and clearing a level falls back to the one above', () => {
    const onChange = mock((_id: string | undefined) => {});
    const { getByLabelText } = render(
      createElement(SpatialLocationPicker, { projectId: 12, value: C4, onChange })
    );
    expect((getByLabelText('Building') as HTMLSelectElement).value).toBe(B1);
    expect((getByLabelText('Floor') as HTMLSelectElement).value).toBe(L03);
    expect((getByLabelText('Zone') as HTMLSelectElement).value).toBe(Z1);
    expect((getByLabelText('Element') as HTMLSelectElement).value).toBe(C4);

    fireEvent.change(getByLabelText('Element'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(Z1);
  });
});

describe('SpatialBreadcrumb', () => {
  const path: SpatialPathSegment[] = [
    { id: B1, level: 'BUILDING', code: 'B1', name: 'Block B' },
    { id: L03, level: 'FLOOR', code: 'L03', name: 'Level 3' },
  ];

  test('renders the codes in order from spatialPath', () => {
    const { getByTestId } = render(createElement(SpatialBreadcrumb, { path }));
    expect(getByTestId('spatial-breadcrumb').textContent).toBe('B1L03');
  });

  test('falls back to the free-text location when there is no path', () => {
    const { queryByTestId, getByText } = render(
      createElement(SpatialBreadcrumb, { path: [], fallback: 'Block C, Ground Floor' })
    );
    expect(queryByTestId('spatial-breadcrumb')).toBeNull();
    expect(getByText('Block C, Ground Floor')).toBeTruthy();
  });
});

describe('SiteStructureTab', () => {
  test('renders the tree through the core hook and adds a floor under a building', () => {
    const { getByTestId, getByLabelText, getByRole } = render(
      createElement(SiteStructureTab, { projectId: 12 })
    );
    expect(useSpatialTree).toHaveBeenCalledWith(12, false);
    expect(getByTestId('spatial-tree')).toBeTruthy();
    expect(getByTestId('spatial-node-B1')).toBeTruthy();
    expect(getByTestId('spatial-node-L03')).toBeTruthy();

    fireEvent.click(getByLabelText('Add floor under B1'));
    fireEvent.change(getByLabelText('Code'), { target: { value: 'L04' } });
    fireEvent.change(getByLabelText('Level index'), { target: { value: '4' } });
    fireEvent.submit(getByRole('form', { name: 'Add floor' }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]?.[0]).toEqual({
      level: 'FLOOR',
      parentId: B1,
      code: 'L04',
      name: 'L04',
      levelIndex: 4,
      elementType: undefined,
    });
  });

  test('archives a node by id and imports pasted rows', () => {
    const { getByLabelText, getByRole } = render(
      createElement(SiteStructureTab, { projectId: 12 })
    );
    fireEvent.click(getByLabelText('Archive L03'));
    expect(mutate.mock.calls[0]?.[0]).toBe(L03);

    fireEvent.change(getByLabelText('Import rows'), {
      target: { value: 'building,floor\nB2,L01\nB2,L02' },
    });
    fireEvent.click(getByRole('button', { name: /Import 2 rows/ }));
    expect(mutate.mock.calls[1]?.[0]).toEqual({
      rows: [
        { building: 'B2', floor: 'L01' },
        { building: 'B2', floor: 'L02' },
      ],
    });
  });
});
