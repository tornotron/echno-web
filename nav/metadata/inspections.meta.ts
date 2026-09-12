import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Eye,
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
    moduleId: 'inspections',
    access: { permissions: ['inspections:view'] },
  },

  // ── module sections ───────────────────────────────────────────────────────
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
  'inspections-observations': {
    label: 'Observations',
    icon: Eye,
    breadcrumb: 'Observations',
    order: 5,
  },
  'inspections-checklists': {
    label: 'Checklist Builder',
    icon: ClipboardList,
    breadcrumb: 'Checklists',
    order: 6,
  },
  'inspections-reports': {
    label: 'Reports',
    icon: BarChart3,
    breadcrumb: 'Reports',
    order: 7,
  },

  // ── inspection detail / create / edit ─────────────────────────────────────
  'inspections-new': { label: 'New Inspection', sidebarHidden: true },
  'inspections-[id]': {
    label: 'Inspection',
    breadcrumb: 'Inspection',
    sidebarHidden: true,
  },
  'inspections-[id]-edit': { label: 'Edit', sidebarHidden: true },
  'inspections-[id]-run': {
    label: 'Run Inspection',
    breadcrumb: 'Run',
    sidebarHidden: true,
  },

  // ── nested detail routes (breadcrumbs only) ───────────────────────────────
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
} satisfies MetadataRegistry;
