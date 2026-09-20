import { describe, expect, test } from 'bun:test';
import { allNavItems, getSidebarItems } from '@/nav';
import type { ComposedNavItem } from '@/nav';
import { STORES_ACCESS } from '@/nav';

/**
 * Stock adjustments carried `sidebarHidden: true` from the first metadata
 * commit, so the whole module (list, detail, approve, reject, edit) was
 * reachable only by typing the URL. These tests pin it visible.
 *
 * It used to be shown on the same terms as Assets, when both were readable by
 * any org member. Since echno-backend #853 its reads are the stores tier
 * (`system-admin`, `project-manager`, `store-keeper`), the same guard as the
 * goods receipts, so the entry is now pinned consistent with those instead:
 * gated on STORES_ACCESS and hidden when locked, so a labourer is not offered
 * a link that 403s.
 */

function findById(
  items: readonly ComposedNavItem[],
  id: string
): ComposedNavItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    const nested = findById(item.children, id);
    if (nested) return nested;
  }
  return undefined;
}

describe('Resources sidebar entries', () => {
  test('stock adjustments is reachable from the sidebar', () => {
    const found = findById(getSidebarItems(), 'resources-stock-adjustments');
    expect(found === undefined).toBe(false);
    expect(found?.label).toBe('Stock Adjustments');
  });

  test('it sits under the Resources group, not at the top level', () => {
    const resources = getSidebarItems().find((item) => item.id === 'resources');
    expect(resources === undefined).toBe(false);
    const child = resources?.children.find(
      (item) => item.id === 'resources-stock-adjustments'
    );
    expect(child === undefined).toBe(false);
  });

  test('it is shown on the same terms as the goods receipts, which it is gated like', () => {
    const receipts = allNavItems.find(
      (i) => i.id === 'resources-goods-receipts'
    );
    const adjustments = allNavItems.find(
      (i) => i.id === 'resources-stock-adjustments'
    );
    expect(receipts === undefined).toBe(false);
    expect(adjustments === undefined).toBe(false);
    expect(adjustments?.sidebarHidden).toBe(receipts?.sidebarHidden ?? true);
    expect(adjustments?.access).toBe(STORES_ACCESS);
    expect(adjustments?.access).toEqual(receipts?.access ?? {});
    expect(adjustments?.hideWhenLocked).toBe(true);
  });

  test('its own child pages stay out of the sidebar', () => {
    const sidebar = getSidebarItems();
    for (const id of [
      'resources-stock-adjustments-new',
      'resources-stock-adjustments-[id]',
      'resources-stock-adjustments-[id]-edit',
    ]) {
      expect(findById(sidebar, id) === undefined).toBe(true);
    }
  });
});
