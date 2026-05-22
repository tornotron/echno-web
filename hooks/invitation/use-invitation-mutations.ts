/**
 * hooks/invitation/use-invitation-mutations.ts
 *
 * Contains mutation hooks for invitation operations.
 *
 * This module exposes mutation hooks that perform write operations
 * against the invitations REST endpoints (generate code, validate code
 * via mutation style, resend). Each hook provides application-level
 * side-effects such as cache invalidation and user-facing toasts.
 *
 * Error handling follows enterprise best-practices: errors are normalized
 * (ApiError), user-friendly messages are presented, and internal errors
 * are logged for diagnostics.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationService } from '@/services/invitation-service';
import { GenerateInviteCodeRequest } from '@/types/invitation';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { invitationKeys } from './invitation-keys';
import { organizationKeys } from '@/hooks/organization/organization-keys';

/**
 * Hook to generate a new invite code.
 * Invalidates the invitations cache for the organization on success.
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const generateMutation = useGenerateInviteCode();
 *
 * generateMutation.mutate({
 *   organizationId: 1,
 *   request: {
 *     designation: 'Software Engineer',
 *     department: 'Engineering',
 *     email: 'employee@example.com',
 *     validityDays: 7,
 *   }
 * });
 * ```
 */
export function useGenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      request,
    }: {
      organizationId: number;
      request: GenerateInviteCodeRequest;
    }) => invitationService.generateCode(organizationId, request),
    onSuccess: (invitation, variables) => {
      // Invalidate invitations list for the organization
      queryClient.invalidateQueries({
        queryKey: invitationKeys.byOrganization(variables.organizationId),
      });

      toast.success('Invite Code Generated', {
        description: `Code: ${invitation.inviteCode}. Valid for ${variables.request.validityDays || 7} days.`,
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

/**
 * Hook to validate an invite code.
 * This is a mutation (not a query) to allow manual triggering and better error handling.
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const validateMutation = useValidateInviteCodeMutation();
 *
 * validateMutation.mutate(
 *   { userId: 1, inviteCode: 'ABC123' },
 *   {
 *     onSuccess: (result) => {
 *       if (result.valid) {
 *         // Proceed with joining organization
 *       }
 *     }
 *   }
 * );
 * ```
 */
export function useValidateInviteCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      inviteCode,
    }: {
      userId: number;
      inviteCode: string;
    }) => invitationService.validateCode(userId, inviteCode),
    onSuccess: (result) => {
      if (result.valid) {
        // Invalidate organizations and user data since validate also joins
        queryClient.invalidateQueries({ queryKey: organizationKeys.all });
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        toast.success('Joined Organization', {
          description: result.invitation
            ? `Successfully joined ${result.invitation.organizationName}`
            : 'Successfully joined the organization',
        });
      } else {
        toast.error('Invalid Invite Code', {
          description: result.message || 'The code is invalid or has expired',
        });
      }
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Validation Failed');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to validate invite code:', error);
    },
  });
}

/**
 * Hook to resend an invitation (generates a new code with same details).
 * This is a convenience wrapper around generateInviteCode.
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const resendMutation = useResendInvitation();
 *
 * resendMutation.mutate({
 *   organizationId: 1,
 *   request: {
 *     designation: 'Software Engineer',
 *     department: 'Engineering',
 *     email: 'employee@example.com',
 *   }
 * });
 * ```
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      request,
    }: {
      organizationId: number;
      request: GenerateInviteCodeRequest;
    }) => invitationService.generateCode(organizationId, request),
    onSuccess: (invitation, variables) => {
      // Invalidate invitations list for the organization
      queryClient.invalidateQueries({
        queryKey: invitationKeys.byOrganization(variables.organizationId),
      });

      toast.success('Invitation Resent', {
        description: `New code generated: ${invitation.inviteCode}`,
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Resend Invitation');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to resend invitation:', error);
    },
  });
}
