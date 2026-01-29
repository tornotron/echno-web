import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { ApiError } from '@/lib/api/api-client';
import { useAttachmentByEntity } from '@/hooks/attachment/use-attachment';
import { User } from '@/types/user/user';

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
 * Hook to fetch the current authenticated user's profile.
 * Includes retry logic for transient errors.
 *
 * Data is prefetched on login by UserPrefetcher and cached for 10 minutes.
 * This means navigating to profile page won't trigger a new fetch if
 * the cached data is still fresh.
 */
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes - matches prefetch staleTime
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch the current user with their CV and profile picture attachments.
 *
 * Since the getCurrentUser endpoint doesn't include cv and profilePicture,
 * this hook fetches them separately using useAttachmentByEntity and combines
 * them with the user data.
 *
 * @example
 * ```tsx
 * const { user, isLoading, error } = useUserWithAttachments();
 *
 * // Access profile picture
 * if (user?.profilePicture) {
 *   console.log(user.profilePicture.file);
 * }
 *
 * // Access CV
 * if (user?.cv) {
 *   console.log(user.cv.fileName);
 * }
 * ```
 */
export function useUserWithAttachments() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();

  const userId = user?.id;

  // Fetch profile picture attachment
  const {
    data: profilePicture,
    isLoading: isProfilePictureLoading,
    error: profilePictureError,
  } = useAttachmentByEntity(userId, 'USER_PROFILE_PICTURE');

  // Fetch CV attachment
  const {
    data: cv,
    isLoading: isCvLoading,
    error: cvError,
  } = useAttachmentByEntity(userId, 'USER_CV');

  // Combine user data with attachments
  const userWithAttachments = useMemo((): User | undefined => {
    if (!user) return undefined;

    return {
      ...user,
      profilePicture: profilePicture ?? user.profilePicture,
      cv: cv ?? user.cv,
    };
  }, [user, profilePicture, cv]);

  return {
    user: userWithAttachments,
    isLoading: isUserLoading,
    isLoadingAttachments: isProfilePictureLoading || isCvLoading,
    error: userError,
    attachmentErrors: {
      profilePicture: profilePictureError,
      cv: cvError,
    },
  };
}
