import { ClipboardCheck } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const inspectionsMetadata = {
  // ── module root ───────────────────────────────────────────────────────────
  inspections: {
    label: 'Inspections',
    icon: ClipboardCheck,
    order: 4,
    breadcrumb: 'Inspections',
  },
  'inspections-new': { label: 'New Inspection', sidebarHidden: true },
  'inspections-[id]': { label: 'Inspection', sidebarHidden: true },
  'inspections-[id]-edit': { label: 'Edit', sidebarHidden: true },
} satisfies MetadataRegistry;
