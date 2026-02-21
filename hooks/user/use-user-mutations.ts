import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserFiles } from '@/services/user-service';
import { User } from '@/types/user/user';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

/**
 * useUpdateUser
 *
 * React Query mutation hook that updates the current user's profile
 * and invalidates the `['user']` query on success. Errors are surfaced
 * via an application toast with context-aware messaging.
 *
 * Use this for updates without file uploads.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.updateCurrentUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Profile');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update user profile:', error);
    },
  });
}

/**
 * useUpdateUserWithFiles
 *
 * React Query mutation hook that updates the current user's profile
 * including file uploads (profile picture, CV).
 * Uses multipart/form-data to send both JSON data and files.
 */
export function useUpdateUserWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: Partial<User>;
      files: UserFiles;
    }) => userService.updateCurrentUserWithFiles(id, data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Profile');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update user profile with files:', error);
    },
  });
}

/**
 * useUpdateUserOrganization
 *
 * React Query mutation hook that updates the user's selected organization preference.
 * This is a silent mutation (no success toast) used for syncing organization
 * context across devices. Updates are optimistically applied.
 */
export function useUpdateUserOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      organizationId,
    }: {
      id: number;
      organizationId: number | null;
    }) => userService.updateUserOrganization(id, organizationId),
    // Optimistically update the cache
    onMutate: async ({ organizationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user'] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<User>(['user']);

      // Optimistically update
      if (previousUser) {
        queryClient.setQueryData<User>(['user'], {
          ...previousUser,
          defaultOrganizationId: organizationId ?? undefined,
        });
      }

      return { previousUser };
    },
    onSuccess: () => {
      // Silently invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['user'], context.previousUser);
      }
      // Silent error - just log it
      logger.error('Failed to update user organization preference:', error);
    },
  });
}
