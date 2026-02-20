import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project-service';
import { ApiError } from '@/lib/api/api-client';

/**
 * Determine if an error should trigger a retry.
 * We don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit).
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 3) return false;

  if (error instanceof ApiError) {
    // Don't retry auth errors or not found
    if (error.isAuthError || error.isNotFound) return false;
    // Retry server errors, timeouts, and network errors
    if (error.isServerError || error.isTimeout || error.status === 0)
      return true;
    // Retry rate limiting
    if (error.status === 429) return true;
    // Don't retry other client errors
    if (error.status >= 400 && error.status < 500) return false;
  }

  // Default: retry network errors
  return true;
}

/**
 * Hook to fetch all projects.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single project by ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useProject(id?: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Project ID is required');
      }
      return projectService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch projects by organization ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useProjectsByOrganization(organizationId?: number) {
  return useQuery({
    queryKey: ['projects', 'organization', organizationId],
    queryFn: () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      return projectService.getByOrganization(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch projects assigned to a specific employee.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useProjectsByEmployee(employeeId?: number) {
  return useQuery({
    queryKey: ['projects', 'employee', employeeId],
    queryFn: () => {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      return projectService.getProjectsByEmployee(employeeId);
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch member employees of a specific project.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useEmployeesByProject(projectId?: number) {
  return useQuery({
    queryKey: ['employees', 'project', projectId],
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return projectService.getEmployeesByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
