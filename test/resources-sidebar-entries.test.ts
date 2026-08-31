import { describe, expect, test } from 'bun:test';
import { allNavItems, getSidebarItems } from '@/nav';
import type { ComposedNavItem } from '@/nav';

/**
 * Stock adjustments is one of only two Resources modules a plain org member can
 * read: `StockAdjustmentControllerWeb` and `AssetControllerWeb` both guard on
 * `isMemberOfCurrentTenant() or hasAnyOrgRoleForCurrentTenant('system-admin',
 * 'project-manager')`, while the other eleven Resources controllers are
 * system-admin only on every method, reads included.
 *
 * Assets has always been in the sidebar. Stock adjustments carried
 * `sidebarHidden: true` from the first metadata commit, so the whole module —
 * list, detail, approve, reject, edit — was reachable only by typing the URL.
 * These tests pin it visible and pin the pair consistent, so the two entries
 * with the same authorization shape cannot drift apart again unnoticed.
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

  test('it is shown on the same terms as assets, which it is gated like', () => {
    const assets = allNavItems.find((i) => i.id === 'resources-assets');
    const adjustments = allNavItems.find(
      (i) => i.id === 'resources-stock-adjustments'
    );
    expect(assets === undefined).toBe(false);
    expect(adjustments === undefined).toBe(false);
    expect(adjustments?.sidebarHidden).toBe(assets?.sidebarHidden ?? true);
    expect(adjustments?.access).toEqual(assets?.access ?? {});
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
