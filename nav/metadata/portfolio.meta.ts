import {
  Layers,
  FolderKanban,
  ClipboardCheck,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const portfolioMetadata = {
  // ── module root ───────────────────────────────────────────────────────────
  portfolio: {
    label: 'Portfolio',
    icon: Layers,
    order: 3,
    breadcrumb: 'Portfolio',
    nonInteractive: true,
  },

  // ── projects sub-section ──────────────────────────────────────────────────
  'portfolio-projects': {
    label: 'Projects',
    icon: FolderKanban,
    order: 1,
    breadcrumb: 'Projects',
  },
  'portfolio-projects-all-projects': {
    label: 'All Projects',
    breadcrumb: 'All Projects',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-new': {
    label: 'New Project',
    sidebarHidden: true,
  },
  'portfolio-projects-all-tasks': { label: 'Tasks', sidebarHidden: true },
  'portfolio-projects-all-issues': { label: 'Issues', sidebarHidden: true },

  // ── project detail ────────────────────────────────────────────────────────
  'portfolio-projects-all-projects-[id]': {
    label: 'Project',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  // ── project tasks ─────────────────────────────────────────────────────────
  'portfolio-projects-all-projects-[id]-tasks': {
    label: 'Tasks',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-tasks-new': {
    label: 'New Task',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-tasks-[taskId]': {
    label: 'Task',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-tasks-[taskId]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  // ── project issues ────────────────────────────────────────────────────────
  'portfolio-projects-all-projects-[id]-issues': {
    label: 'Issues',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-issues-new': {
    label: 'New Issue',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-issues-[issueId]': {
    label: 'Issue',
    sidebarHidden: true,
  },
  'portfolio-projects-all-projects-[id]-issues-[issueId]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  // ── inspections sub-section ───────────────────────────────────────────────
  'portfolio-inspections': {
    label: 'Inspections',
    icon: ClipboardCheck,
    order: 2,
    breadcrumb: 'Inspections',
  },
  'portfolio-inspections-new': { label: 'New Inspection', sidebarHidden: true },
  'portfolio-inspections-[id]': { label: 'Inspection', sidebarHidden: true },
  'portfolio-inspections-[id]-edit': { label: 'Edit', sidebarHidden: true },
} satisfies MetadataRegistry;
