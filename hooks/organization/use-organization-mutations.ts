import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { Organization } from '@/types/organization/organization';
import { toast } from '@/lib/styles/toast-styles';

/**
 * useCreateOrganization
 *
 * React Query mutation hook that creates an organization and invalidates
 * the `['organizations']` query on success. Errors are surfaced via
 * an application toast and logged to the console for diagnostics.
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization Created', {
        description: 'The organization has been created successfully',
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Failed to Create Organization', {
        description: errorMessage,
      });
      console.error(error);
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
    mutationFn: ({ id, data }: { id: number; data: Organization }) =>
      organizationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization Updated', {
        description: 'The organization has been updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Failed to Update Organization', {
        description: errorMessage,
      });
      console.error(error);
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
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Failed to Delete Organization', {
        description: errorMessage,
      });
      console.error(error);
    },
  });
}
