import { useQuery } from '@tanstack/react-query';
import { invitationService } from '@/services/invitation-service';
import { shouldRetry } from '@/lib/utils/retry';
import { invitationKeys } from './invitation-keys';

export function useInvitationsByProject(projectId?: number) {
  return useQuery({
    queryKey: invitationKeys.byProject(projectId),
    queryFn: () => {
      if (!projectId) throw new Error('Project ID is required');
      return invitationService.getByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

export function useInvitationById(id?: number) {
  return useQuery({
    queryKey: invitationKeys.detail(id),
    queryFn: () => {
      if (!id) throw new Error('Invitation ID is required');
      return invitationService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
