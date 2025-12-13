import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@/types/project/project';
import { mockProjects } from '@/components/shared/mock-data';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// API Functions (replace with actual API calls)
const fetchProjects = async (): Promise<Project[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockProjects;
};

const fetchProjectById = async (id: number): Promise<Project> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));
  const project = mockProjects.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
};

const createProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    ...project,
    id: Math.max(...mockProjects.map((p) => p.id)) + 1,
    createdAt: new Date(),
  };
};

const updateProject = async (project: Project): Promise<Project> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return project;
};

const deleteProject = async (id: number): Promise<void> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
};

// React Query Hooks

export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
  });
};

export const useProject = (id: number) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data: Project) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_: unknown, id: number) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
};
