import { ClipboardCheck } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const inspectionsMetadata = {
  // ── module root ───────────────────────────────────────────────────────────
  // The module is a placeholder while it is rebuilt, so it currently has no
  // child routes. Re-add new/[id]/[id]-edit entries when those pages return.
  inspections: {
    label: 'Inspections',
    icon: ClipboardCheck,
    section: 'inspections',
    order: 4,
    breadcrumb: 'Inspections',
  },
} satisfies MetadataRegistry;
