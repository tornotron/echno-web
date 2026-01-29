import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserFiles } from '@/services/user-service';
import { User } from '@/types/user/user';
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
