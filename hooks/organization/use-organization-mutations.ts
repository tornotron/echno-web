import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { Organization } from '@/types/organization/organization';
import { toast } from '@/lib/styles/toast-styles';
import { ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';

/**
 * Get a user-friendly error message from an error.
 * Uses ApiError's pre-formatted messages when available.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get appropriate toast title based on error type.
 */
function getErrorTitle(error: unknown, defaultTitle: string): string {
  if (error instanceof ApiError) {
    if (error.isAuthError) return 'Authentication Required';
    if (error.isTimeout) return 'Request Timeout';
    if (error.isServerError) return 'Server Error';
    if (error.status === 0) return 'Network Error';
  }
  return defaultTitle;
}

/**
 * useCreateOrganization
 *
 * React Query mutation hook that creates an organization and invalidates
 * the `['organizations']` query on success. Errors are surfaced via
 * an application toast with context-aware messaging.
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, logoFile }: { data: Organization; logoFile?: File }) =>
      organizationService.create(data, logoFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization Created', {
        description: 'The organization has been created successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Create Organization');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create organization:', error);
    },
  });
}

/**
 * useUpdateOrganization
 *
 * Mutation hook to update an existing organization. Expects an object
 * with `id` and `data` where `data` conforms to the `Organization` type.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      logoFile,
    }: {
      id: number;
      data: Organization;
      logoFile?: File;
    }) => organizationService.update(id, data, logoFile),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', id] });
      toast.success('Organization Updated', {
        description: 'The organization has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Organization');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update organization:', error);
    },
  });
}

/**
 * useDeleteOrganization
 *
 * Mutation hook that deletes an organization by id and invalidates the
 * `['organizations']` cache entry on success. Errors are surfaced via toast.
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization Deleted', {
        description: 'The organization has been deleted successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Organization');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete organization:', error);
    },
  });
}
