import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { ApiError } from '@/lib/api/api-client';
import { useUser } from '@/hooks/user/use-user';
import { useCurrentUserEmployee } from '@/hooks/employee/use-employee';
import { useAttachmentByEntity } from '@/hooks/attachment/use-attachment';
import { Organization } from '@/types/organization';

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
 * Hook to fetch all organizations.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single organization by ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useOrganization(id: number) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch an organization with its logo attachment.
 *
 * Since the organization endpoint doesn't include the logo,
 * this hook fetches it separately using useAttachmentByEntity and combines
 * it with the organization data.
 *
 * @param id - Organization ID
 *
 * @example
 * ```tsx
 * const { organization, isLoading, error } = useOrganizationWithLogo(orgId);
 *
 * // Access logo
 * if (organization?.logo) {
 *   console.log(organization.logo.file);
 * }
 * ```
 */
export function useOrganizationWithLogo(id: number) {
  const {
    data: organization,
    isLoading: isOrgLoading,
    error: orgError,
  } = useOrganization(id);

  const organizationId = organization?.id;

  // Fetch logo attachment
  const {
    data: logo,
    isLoading: isLogoLoading,
    error: logoError,
  } = useAttachmentByEntity(organizationId, 'ORGANIZATION');

  // Combine organization data with logo
  const organizationWithLogo = useMemo((): Organization | undefined => {
    if (!organization) return undefined;

    return {
      ...organization,
      logo: logo ?? organization.logo,
    };
  }, [organization, logo]);

  return {
    organization: organizationWithLogo,
    isLoading: isOrgLoading,
    isLoadingLogo: isLogoLoading,
    error: orgError,
    logoError,
  };
}

/**
 * Hook to get the current user's organizations.
 * Returns organizations that the user either created or is part of as an employee.
 *
 * This hook combines:
 * 1. Organizations created by the user (via getByCreator endpoint)
 * 2. Organizations where the user is an employee (from employee.organizations)
 */
export function useUserOrganizations() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();
  const { data: employee, isLoading: isEmployeeLoading } =
    useCurrentUserEmployee();

  // Fetch organizations created by the user
  const {
    data: createdOrgs,
    isLoading: isCreatedOrgsLoading,
    error: createdOrgsError,
  } = useQuery({
    queryKey: ['organizations', 'creator', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      return organizationService.getByCreator(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  // Combine organizations from both sources and deduplicate by ID
  const organizations = React.useMemo(() => {
    const orgsMap = new Map();

    // Add organizations created by the user
    if (createdOrgs) {
      for (const org of createdOrgs) {
        if (org.id) orgsMap.set(org.id, org);
      }
    }

    // Add organizations where user is an employee
    if (employee?.organizations) {
      for (const org of employee.organizations) {
        if (org.id) orgsMap.set(org.id, org);
      }
    }

    return [...orgsMap.values()];
  }, [createdOrgs, employee]);

  return {
    data: organizations,
    isLoading: isUserLoading || isEmployeeLoading || isCreatedOrgsLoading,
    error: userError || createdOrgsError,
    user,
  };
}
