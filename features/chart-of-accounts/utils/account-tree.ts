import type { AccountTreeNode } from '@tornotron/echno-core/finance/types';

/**
 * A flattened account row carrying its depth in the tree, used to render the
 * chart of accounts as an indented table and to build account pickers.
 */
export interface FlatAccountNode {
  node: AccountTreeNode;
  /** 0 for roots, incremented for each level of nesting. */
  depth: number;
}

/**
 * Flattens the account tree depth-first into an ordered list, tagging each node
 * with its depth so callers can indent it. Children keep the order the API
 * returned them in.
 */
export function flattenAccountTree(
  nodes: AccountTreeNode[],
  depth = 0
): FlatAccountNode[] {
  const rows: FlatAccountNode[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.children && node.children.length > 0) {
      rows.push(...flattenAccountTree(node.children, depth + 1));
    }
  }
  return rows;
}

/**
 * Returns every postable account in the tree (the leaf accounts journal lines
 * may post to), depth-first. These are the only valid targets for a
 * posting-account mapping, so the mapping picker lists exactly these.
 */
export function collectPostableAccounts(
  nodes: AccountTreeNode[]
): AccountTreeNode[] {
  const postable: AccountTreeNode[] = [];
  for (const node of nodes) {
    if (node.postable) {
      postable.push(node);
    }
    if (node.children && node.children.length > 0) {
      postable.push(...collectPostableAccounts(node.children));
    }
  }
  return postable;
}

/**
 * Finds the id of the parent of `childId` in the tree, or `null` when the
 * account is a root. `AccountTreeNode` does not carry a `parentId`, so the
 * parent is recovered from the tree structure, used to pre-select the parent
 * when editing an account.
 */
export function findParentId(
  nodes: AccountTreeNode[],
  childId: string,
  parentId: string | null = null
): string | null {
  for (const node of nodes) {
    if (node.id === childId) {
      return parentId;
    }
    const found = findParentId(node.children ?? [], childId, node.id);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

/**
 * Collects the ids of `target` and every account beneath it. When editing an
 * account's parent, these are the ids that must be excluded from the parent
 * picker so a node can never become its own ancestor.
 */
export function collectSubtreeIds(target: AccountTreeNode): Set<string> {
  const ids = new Set<string>();
  const walk = (node: AccountTreeNode) => {
    ids.add(node.id);
    for (const child of node.children ?? []) {
      walk(child);
    }
  };
  walk(target);
  return ids;
}
