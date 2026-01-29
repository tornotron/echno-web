'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { employeeService } from '@/services/employee-service';
import { organizationService } from '@/services/organization-service';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/api/api-client';

/**
 * UserPrefetcher
 *
 * Prefetches user-related data when the user is authenticated:
 * 1. User profile data
 * 2. Employee data (if user is an employee)
 * 3. Organizations created by the user
 *
 * This ensures all user-related data is available in the React Query cache
 * before navigating to pages that need them.
 *
 * The prefetch happens once after login and the data is cached
 * according to the staleTime configured in respective hooks.
 */
export function UserPrefetcher({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch when authenticated and haven't prefetched yet
    if (status === 'authenticated' && !hasPrefetched.current) {
      hasPrefetched.current = true;

      // Fetch user data and then attempt to fetch related data
      userService
        .getCurrentUser()
        .then((user) => {
          // Set user data in cache
          queryClient.setQueryData(['user'], user);
          logger.debug('User profile prefetched successfully');

          if (user?.id) {
            // Prefetch employee record (if user is an employee)
            employeeService
              .getById(user.id)
              .then((employee) => {
                queryClient.setQueryData(['employees', user.id], employee);
                logger.debug('Employee profile prefetched successfully');
              })
              .catch((error) => {
                // It's okay if employee fetch fails (user might not be an employee)
                if (error instanceof ApiError && error.isNotFound) {
                  logger.debug('User is not an employee');
                } else {
                  logger.error('Failed to prefetch employee profile:', error);
                }
              });

            // Prefetch organizations created by the user
            organizationService
              .getByCreator(user.id)
              .then((organizations) => {
                queryClient.setQueryData(
                  ['organizations', 'creator', user.id],
                  organizations
                );
                logger.debug('User organizations prefetched successfully');
              })
              .catch((error) => {
                logger.error('Failed to prefetch user organizations:', error);
              });
          }
        })
        .catch((error) => {
          logger.error('Failed to prefetch user profile:', error);
          // Reset flag so it can retry on next mount
          hasPrefetched.current = false;
        });
    }

    // Reset flag when user logs out
    if (status === 'unauthenticated') {
      hasPrefetched.current = false;
    }
  }, [status, queryClient]);

  return <>{children}</>;
}
