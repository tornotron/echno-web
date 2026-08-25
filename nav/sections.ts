/**
 * nav/sections.ts
 *
 * Ordered sidebar sections. Each top-level nav item declares its `section`
 * in metadata; the sidebar groups items under these labelled headers.
 *
 * Items whose `section` is missing or unrecognized fall into DEFAULT_SECTION.
 * Sections with no visible items are dropped, so gating a whole module by
 * role never leaves an orphaned header behind.
 */

import type { ComposedNavItem } from './types';

export interface NavSection {
  id: string;
  label: string;
}

export const SIDEBAR_SECTIONS: NavSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'inspections', label: 'Inspections' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'operations', label: 'Operations' },
  { id: 'system', label: 'System' },
];

/** Items without a recognized section fall here (rendered first). */
export const DEFAULT_SECTION = 'overview';

export interface SectionGroup<
  T extends { section?: string } = ComposedNavItem,
> {
  section: NavSection;
  items: T[];
}

/** Group top-level nav items into ordered sections (empty sections dropped). */
export function groupBySection<T extends { section?: string }>(
  items: T[]
): SectionGroup<T>[] {
  const knownIds = new Set(SIDEBAR_SECTIONS.map((s) => s.id));

  return SIDEBAR_SECTIONS.map((section) => ({
    section,
    items: items.filter((item) => {
      const id =
        item.section && knownIds.has(item.section)
          ? item.section
          : DEFAULT_SECTION;
      return id === section.id;
    }),
  })).filter((group) => group.items.length > 0);
}
