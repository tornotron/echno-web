import { FolderKanban, ClipboardCheck } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const projectsMetadata = {
  projects: {
    label: 'Projects',
    icon: FolderKanban,
    order: 3,
  },
  'projects-new': { label: 'New Project', sidebarHidden: true },
  'projects-tasks': { label: 'Tasks', sidebarHidden: true },
  'projects-issues': { label: 'Issues', sidebarHidden: true },

  // ── inspections ───────────────────────────────────────────────────────────
  'projects-inspections': {
    label: 'Inspections',
    icon: ClipboardCheck,
    order: 2,
  },
  'projects-inspections-new': { label: 'New Inspection', sidebarHidden: true },
  'projects-inspections-[id]': { label: 'Inspection', sidebarHidden: true },
  'projects-inspections-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── project detail ────────────────────────────────────────────────────────
  'projects-[id]': { label: 'Project', sidebarHidden: true },
  'projects-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── project tasks ─────────────────────────────────────────────────────────
  'projects-[id]-tasks': { label: 'Tasks', sidebarHidden: true },
  'projects-[id]-tasks-new': { label: 'New Task', sidebarHidden: true },
  'projects-[id]-tasks-[taskId]': { label: 'Task', sidebarHidden: true },
  'projects-[id]-tasks-[taskId]-edit': { label: 'Edit', sidebarHidden: true },

  // ── project issues ────────────────────────────────────────────────────────
  'projects-[id]-issues': { label: 'Issues', sidebarHidden: true },
  'projects-[id]-issues-new': { label: 'New Issue', sidebarHidden: true },
  'projects-[id]-issues-[issueId]': { label: 'Issue', sidebarHidden: true },
  'projects-[id]-issues-[issueId]-edit': { label: 'Edit', sidebarHidden: true },
} satisfies MetadataRegistry;
