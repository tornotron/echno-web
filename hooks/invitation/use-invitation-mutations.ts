import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationService } from '@/services/invitation-service';
import { api } from '@/lib/api/api-client';
import { GenerateInviteCodeRequest } from '@/types/invitation';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { invitationKeys } from './invitation-keys';

export function useGenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: GenerateInviteCodeRequest) =>
      invitationService.generateCode(dto),
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.byProject(invitation.projectId),
      });
      toast.success('Invite Code Generated', {
        description: `Code: ${invitation.inviteCode}`,
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Generate Invite Code');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to generate invite code:', error);
    },
  });
}

export function useDeleteInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => invitationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      toast.success('Invite Code Deleted');
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Invite Code');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete invite code:', error);
    },
  });
}

export function useJoinWithInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    // POST /api/v1/project/web/invite-codes/join — endpoint TBC with backend team
    mutationFn: ({ inviteCode }: { inviteCode: string }) =>
      api.post<void>('/api/v1/project/web/invite-codes/join', { inviteCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Joined Successfully');
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Join');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to join with invite code:', error);
    },
  });
}
