import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const inspectionsMetadata = {
  // ── module root ───────────────────────────────────────────────────────────
  inspections: {
    label: 'Inspections',
    icon: ClipboardCheck,
    section: 'inspections',
    order: 4,
    breadcrumb: 'Inspections',
  },

  'inspections-qa-qc': {
    label: 'QA/QC',
    icon: ClipboardCheck,
    breadcrumb: 'QA/QC',
    order: 2,
  },
  'inspections-safety': {
    label: 'Safety',
    icon: HardHat,
    breadcrumb: 'Safety',
    order: 3,
  },
  'inspections-ncr': {
    label: 'NCR / Defects',
    icon: ShieldAlert,
    breadcrumb: 'NCR / Defects',
    order: 4,
  },
  'inspections-checklists': {
    label: 'Checklist Builder',
    icon: ClipboardList,
    breadcrumb: 'Checklists',
    order: 5,
  },
  'inspections-reports': {
    label: 'Reports',
    icon: BarChart3,
    breadcrumb: 'Reports',
    order: 6,
  },

  // ── detail routes (breadcrumbs only) ──────────────────────────────────────
  'inspections-checklists-[id]': {
    label: 'Builder',
    icon: LayoutDashboard,
    breadcrumb: 'Builder',
    sidebarHidden: true,
  },
  'inspections-ncr-[id]': {
    label: 'NCR',
    breadcrumb: 'NCR',
    sidebarHidden: true,
  },
  'inspections-[id]': {
    label: 'Inspection',
    breadcrumb: 'Inspection',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
