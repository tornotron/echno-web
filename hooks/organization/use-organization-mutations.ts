import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { CreateOrganizationRequest } from '@/types/organization/organization-create';
import { UpdateOrganizationRequest } from '@/types/organization/organization-update';
import { OrganizationFiles } from '@/types/organization/organization-files';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { organizationKeys } from './organization-keys';

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: CreateOrganizationRequest;
      files?: OrganizationFiles;
    }) => organizationService.create(data, files),
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

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: UpdateOrganizationRequest;
      files?: OrganizationFiles;
    }) => organizationService.update(id, data, files),
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
