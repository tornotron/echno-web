import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileCheck2,
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
    access: { permissions: ['inspections:read'] },
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

  // ── contract billing (Work Progress module) ──────────────────────────────
  // Running account and milestone bills, moved here from Finance. Any member
  // reads them; the steps are gated per action on the pages. Hidden for an
  // organization without MODULE_WORK_PROGRESS.
  'inspections-billing': {
    label: 'Billing',
    icon: FileCheck2,
    breadcrumb: 'Billing',
    description:
      'Running account and milestone bills from contractors, by project, through measurement and certification to payment.',
    order: 8,
    moduleId: 'work-progress',
  },
  'inspections-billing-contracts': {
    label: 'Contracts',
    sidebarHidden: true,
    nonInteractive: true,
  },
  'inspections-billing-contracts-[id]': {
    label: 'Contract',
    sidebarHidden: true,
  },
  'inspections-billing-bills': {
    label: 'Bills',
    sidebarHidden: true,
    nonInteractive: true,
  },
  'inspections-billing-bills-[id]': { label: 'Bill', sidebarHidden: true },

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
