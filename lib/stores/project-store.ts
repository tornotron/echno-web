import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Project } from '@/types/project/project';
import { ProjectStatus } from '@/types/project/project-status';

interface ProjectState {
  // Selected project for viewing/editing
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;

  // Project filters
  filters: {
    search: string;
    status: ProjectStatus | 'all';
    sortBy: 'name' | 'startDate' | 'endDate' | 'status';
    sortOrder: 'asc' | 'desc';
  };
  setFilter: <K extends keyof ProjectState['filters']>(
    key: K,
    value: ProjectState['filters'][K]
  ) => void;
  resetFilters: () => void;

  // Recently viewed projects
  recentlyViewed: number[];
  addRecentlyViewed: (projectId: number) => void;
  clearRecentlyViewed: () => void;
}

const initialFilters = {
  search: '',
  status: 'all' as const,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
};

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set) => ({
      selectedProject: null,
      setSelectedProject: (project: Project | null) => set({ selectedProject: project }),

      filters: initialFilters,
      setFilter: (key: keyof ProjectState['filters'], value: ProjectState['filters'][keyof ProjectState['filters']]) =>
        set((state: ProjectState) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: initialFilters }),

      recentlyViewed: [],
      addRecentlyViewed: (projectId: number) =>
        set((state: ProjectState) => {
          const filtered = state.recentlyViewed.filter((id: number) => id !== projectId);
          return {
            recentlyViewed: [projectId, ...filtered].slice(0, 10), // Keep last 10
          };
        }),
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
    }),
    { name: 'ProjectStore' }
  )
);
