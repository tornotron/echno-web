import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@/types/project/project';
import { projectService } from '@/services/project-service';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// API Functions
const fetchProjects = async (): Promise<Project[]> => {
  return projectService.getAll();
};

const fetchProjectById = async (id: number): Promise<Project> => {
  return projectService.getById(id);
};

const createProject = async (
  project: Omit<Project, 'id' | 'createdAt'>
): Promise<Project> => {
  return projectService.create(
    project as Parameters<typeof projectService.create>[0]
  );
};

const updateProject = async (project: Project): Promise<Project> => {
  return projectService.update(
    project.id,
    project as Parameters<typeof projectService.update>[1]
  );
};

const deleteProject = async (id: number): Promise<void> => {
  return projectService.delete(id);
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
