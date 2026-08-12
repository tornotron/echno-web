import { FolderKanban } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const projectsMetadata = {
  // ── module root ───────────────────────────────────────────────────────────
  projects: {
    label: 'Projects',
    icon: FolderKanban,
    section: 'projects',
    order: 3,
    breadcrumb: 'Projects',
  },
  'projects-all-projects': {
    label: 'All Projects',
    breadcrumb: 'All Projects',
    sidebarHidden: true,
  },
  'projects-all-projects-new': {
    label: 'New Project',
    sidebarHidden: true,
  },
  'projects-all-tasks': { label: 'Tasks', sidebarHidden: true },
  'projects-all-issues': { label: 'Issues', sidebarHidden: true },

  // ── project detail ────────────────────────────────────────────────────────
  'projects-all-projects-[id]': {
    label: 'Project',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  // ── project tasks ─────────────────────────────────────────────────────────
  'projects-all-projects-[id]-tasks': {
    label: 'Tasks',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-tasks-new': {
    label: 'New Task',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-tasks-[taskId]': {
    label: 'Task',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-tasks-[taskId]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  // ── project issues ────────────────────────────────────────────────────────
  'projects-all-projects-[id]-issues': {
    label: 'Issues',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-issues-new': {
    label: 'New Issue',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-issues-[issueId]': {
    label: 'Issue',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-issues-[issueId]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
