import { describe, expect, test } from 'bun:test';
import { AccountType } from '@tornotron/echno-core/finance/types';
import type { AccountTreeNode } from '@tornotron/echno-core/finance/types';
import {
  collectPostableAccounts,
  collectSubtreeIds,
  findParentId,
  flattenAccountTree,
} from './account-tree';

function node(
  id: string,
  overrides: Partial<AccountTreeNode> = {}
): AccountTreeNode {
  return {
    id,
    code: id,
    name: `Account ${id}`,
    type: AccountType.ASSET,
    active: true,
    postable: false,
    children: [],
    ...overrides,
  };
}

const tree: AccountTreeNode[] = [
  node('1', {
    children: [
      node('1-1', { postable: true }),
      node('1-2', {
        children: [node('1-2-1', { postable: true })],
      }),
    ],
  }),
  node('2', { postable: true }),
];

describe('flattenAccountTree', () => {
  test('walks depth-first and tags depth', () => {
    const rows = flattenAccountTree(tree);
    expect(rows.map((r) => r.node.id)).toEqual([
      '1',
      '1-1',
      '1-2',
      '1-2-1',
      '2',
    ]);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 1, 2, 0]);
  });

  test('empty tree yields no rows', () => {
    expect(flattenAccountTree([])).toEqual([]);
  });
});

describe('collectPostableAccounts', () => {
  test('returns only postable leaves, depth-first', () => {
    expect(collectPostableAccounts(tree).map((n) => n.id)).toEqual([
      '1-1',
      '1-2-1',
      '2',
    ]);
  });
});

describe('findParentId', () => {
  test('returns the parent id of a nested account', () => {
    expect(findParentId(tree, '1-2-1')).toBe('1-2');
    expect(findParentId(tree, '1-1')).toBe('1');
  });

  test('returns null for a root account', () => {
    expect(findParentId(tree, '1')).toBeNull();
    expect(findParentId(tree, '2')).toBeNull();
  });

  test('returns null for an unknown id', () => {
    expect(findParentId(tree, 'nope')).toBeNull();
  });
});

describe('collectSubtreeIds', () => {
  test('includes the target and all descendants', () => {
    const ids = collectSubtreeIds(tree[0]);
    expect([...ids].sort()).toEqual(['1', '1-1', '1-2', '1-2-1']);
  });

  test('a leaf yields just itself', () => {
    expect([...collectSubtreeIds(tree[1])]).toEqual(['2']);
  });
});
