/**
 * The web leave surface shares one query-key factory with core. The sidebar
 * badge, the approvals tab and the mutation layer all invalidate through
 * `leaveKeys`; if web ever grew its own copy again, a mutation would patch
 * one cache while the badge read another.
 */

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { leaveKeys as hooksKeys } from '@tornotron/echno-core/leave/hooks';
import { leaveKeys as keysEntry } from '@tornotron/echno-core/leave/hooks/keys';
import { leaveKeys as rootKeys } from '@tornotron/echno-core';

describe("leaveKeys is core's single factory", () => {
  it('every entry point hands back the same object', () => {
    expect(hooksKeys).toBe(keysEntry);
    expect(hooksKeys).toBe(rootKeys);
  });

  it('keeps the approver id as a cache-slot name on the three approver reads', () => {
    expect(hooksKeys.approverRequests(5)).toEqual([
      ...hooksKeys.requests(),
      'approver',
      5,
    ]);
    expect(hooksKeys.pendingApprovals(5)).toEqual([
      ...hooksKeys.requests(),
      'pending',
      5,
    ]);
    expect(hooksKeys.pendingApprovalsCount(5)).toEqual([
      ...hooksKeys.requests(),
      'pending',
      5,
      'count',
    ]);
  });

  it('is the factory the badge, the approvals tab and the mutation layer resolve', () => {
    const root = path.join(import.meta.dir, '..', '..');
    const readers = {
      'features/common/components/sidebar.tsx':
        "from '@tornotron/echno-core/leave/hooks'",
      'features/leave/components/leave-requests-tabs/approvals-tab.tsx':
        "from '@tornotron/echno-core/leave/hooks'",
      'hooks/leave/use-leave-mutations.ts':
        "import { leaveKeys } from '@tornotron/echno-core/leave/hooks/keys'",
    };
    for (const [file, line] of Object.entries(readers)) {
      const source = readFileSync(path.join(root, file), 'utf8');
      expect(source.includes(line)).toBe(true);
      expect(source.includes("'@/hooks/leave/use-leave'")).toBe(false);
    }
  });

  it('roots every key under leave', () => {
    expect(hooksKeys.all).toEqual(['leave']);
    expect(hooksKeys.request(7)).toEqual(['leave', 'requests', 7]);
    expect(hooksKeys.balances()).toEqual(['leave', 'balances']);
  });
});
