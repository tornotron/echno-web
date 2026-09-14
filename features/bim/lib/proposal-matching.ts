import type { BimHierarchyProposal } from '@tornotron/echno-core/bim/types';
import type { SpatialTreeNode } from '@tornotron/echno-core/spatial/types';

/** A proposed node as far as matching is concerned: its IFC GlobalId and the match the backend recorded. */
export interface ProposedNodeLike {
  globalId?: string;
  matchedNodeId?: string;
}

/**
 * The project's spatial nodes by IFC GlobalId, archived ones included: the
 * backend's confirm matches by `bimElementGuid` through
 * `findByBimElementGuid`, which restores an archived node rather than
 * duplicating it, so archived nodes match too.
 */
export function spatialGuidIndex(tree: SpatialTreeNode[] | undefined): Map<string, string> {
  const index = new Map<string, string>();
  const walk = (nodes: SpatialTreeNode[]) => {
    for (const node of nodes) {
      if (node.bimElementGuid) index.set(node.bimElementGuid, node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  if (tree) walk(tree);
  return index;
}

/**
 * The node confirm would match instead of create: the id the proposal
 * already carries, else the project node holding the same GlobalId. The
 * proposal is built once at ingestion, so nodes created since (a CSV import,
 * a hand-built tree) show as "new" in the stored proposal while confirm
 * matches them; running the same lookup here keeps the label right
 * (web #463).
 */
export function matchedNodeFor(
  node: ProposedNodeLike,
  index: Map<string, string>
): string | undefined {
  if (node.matchedNodeId) return node.matchedNodeId;
  return node.globalId ? index.get(node.globalId) : undefined;
}

/** How many of the proposal's buildings, floors and zones confirm would match. */
export function countMatchedStructure(
  proposal: BimHierarchyProposal,
  index: Map<string, string>
): number {
  let n = 0;
  for (const b of proposal.buildings) {
    if (matchedNodeFor(b, index)) n++;
    for (const f of b.floors) {
      if (matchedNodeFor(f, index)) n++;
      for (const z of f.zones) {
        if (matchedNodeFor(z, index)) n++;
      }
    }
  }
  return n;
}
