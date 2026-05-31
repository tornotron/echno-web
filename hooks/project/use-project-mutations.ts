import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project-service';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFiles,
} from '@/types/project';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { projectKeys } from './project-keys';
import { employeeKeys } from '@/hooks/employee/employee-keys';

/**
 * useCreateProject
 *
 * React Query mutation hook that creates a project and invalidates
 * the `['projects']` query on success. Errors are surfaced via
 * an application toast with context-aware messaging.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProjectRequest) => projectService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project Created', {
        description: 'The project has been created successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Create Project');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create project:', error);
    },
  });
}

/**
 * useCreateProjectWithFiles
 *
 * React Query mutation hook that creates a project with file attachments.
 * Invalidates the `['projects']` query on success.
 */
export function useCreateProjectWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: CreateProjectRequest;
      files: ProjectFiles;
    }) => projectService.createWithFiles(data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project Created', {
        description: 'The project has been created successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Create Project');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create project with files:', error);
    },
  });
}

/**
 * useUpdateProject
 *
 * Mutation hook to update an existing project. Expects an object
 * with `id` and `data` where `data` conforms to the `Partial<Project>` type.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectRequest }) =>
      projectService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      toast.success('Project Updated', {
        description: 'The project has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Project');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update project:', error);
    },
  });
}

/**
 * useUpdateProjectWithFiles
 *
 * Mutation hook to update an existing project with file attachments.
 */
export function useUpdateProjectWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: UpdateProjectRequest;
      files: ProjectFiles;
    }) => projectService.updateWithFiles(id, data, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      toast.success('Project Updated', {
        description: 'The project has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Project');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update project with files:', error);
    },
  });
}

/**
 * useAddEmployeeToProject
 *
 * Mutation hook that adds an employee to a project via the API.
 * Invalidates both the projects list and the specific project query on success.
 */
export function useAddEmployeeToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      employeeId,
    }: {
      projectId: number;
      employeeId: number;
    }) => projectService.addEmployee(projectId, employeeId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success('Employee Added', {
        description: 'The employee has been added to the project',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Add Employee');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to add employee to project:', error);
    },
  });
}

/**
 * useRemoveEmployeeFromProject
 *
 * Mutation hook that removes an employee from a project via the API.
 * Invalidates both the projects list and the specific project query on success.
 */
export function useRemoveEmployeeFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      employeeId,
    }: {
      projectId: number;
      employeeId: number;
    }) => projectService.removeEmployee(projectId, employeeId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success('Employee Removed', {
        description: 'The employee has been removed from the project',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Remove Employee');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to remove employee from project:', error);
    },
  });
}

/**
 * useDeleteProject
 *
 * Mutation hook that deletes a project by id and invalidates the
 * `['projects']` cache entry on success. Errors are surfaced via toast.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project Deleted', {
        description: 'The project has been deleted successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Project');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete project:', error);
    },
  });
}
