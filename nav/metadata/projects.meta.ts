import { FolderKanban } from 'lucide-react';
import type { MetadataRegistry, RouteMetadata } from '../types';
import { PROJECT_WRITE_ACCESS } from '../access/roles';

/**
 * Raising, editing and deleting an issue is `system-admin` or
 * `project-manager`, the pair that writes tasks (echno-backend #853). The
 * lists and the detail stay open to any member.
 */
const issueWrite = {
  access: PROJECT_WRITE_ACCESS,
  hideWhenLocked: true,
} satisfies RouteMetadata;

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
  'projects-all-projects-[id]-bim': {
    label: 'BIM',
    breadcrumb: 'BIM',
    sidebarHidden: true,
    moduleId: 'bim',
    access: { permissions: ['bim:view'] },
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
    ...issueWrite,
    label: 'New Issue',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-issues-[issueId]': {
    label: 'Issue',
    sidebarHidden: true,
  },
  'projects-all-projects-[id]-issues-[issueId]-edit': {
    ...issueWrite,
    label: 'Edit',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
