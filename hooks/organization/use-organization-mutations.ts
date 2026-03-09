import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { Organization } from '@/types/organization/organization';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { organizationKeys } from './organization-keys';

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
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
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
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(id) });
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
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
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
