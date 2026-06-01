import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { User } from '@/types/user/user';
import { UserFiles } from '@/types/user/user-files';
import { UpdateUserRequest } from '@/types/user/user-update';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { userKeys } from './user-keys';

/**
 * useUpdateUser
 *
 * Updates the current user's profile (no files). Backend: `PATCH /user/web/{id}
 * → UserDto` (full). Patches `userKeys.all` directly with the response.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userService.updateCurrentUser(id, data),
    onSuccess: (updatedUser) => {
      // PATCH /user/web/{id} → UserDto (full).
      // Direct patch — response is the canonical updated user.
      queryClient.setQueryData<User>(userKeys.all, updatedUser);
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
 * Updates the current user's profile including file uploads (profile picture,
 * CV). Multipart variant of `useUpdateUser`. Same response shape — full UserDto.
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
      data: UpdateUserRequest;
      files: UserFiles;
    }) => userService.updateCurrentUserWithFiles(id, data, files),
    onSuccess: (updatedUser) => {
      // PATCH multipart /user/web/{id} → UserDto (full, with new attachments).
      queryClient.setQueryData<User>(userKeys.all, updatedUser);
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
 * Updates the user's selected organization preference. Silent mutation
 * (no success toast) used for syncing organization context across devices.
 * Backend: same PATCH endpoint as profile update, returns full UserDto.
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
    onMutate: async ({ organizationId }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUser = queryClient.getQueryData<User>(userKeys.all);

      if (previousUser) {
        queryClient.setQueryData<User>(userKeys.all, {
          ...previousUser,
          defaultOrganizationId: organizationId ?? undefined,
        });
      }

      return { previousUser };
    },
    onSuccess: (updatedUser) => {
      // PATCH /user/web/{id} → UserDto (full).
      // Reconcile with the server response — replaces the optimistic value.
      queryClient.setQueryData<User>(userKeys.all, updatedUser);
    },
    onError: (error, _variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.all, context.previousUser);
      }
      logger.error('Failed to update user organization preference:', error);
    },
  });
}
