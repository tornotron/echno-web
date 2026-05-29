/**
 * lib/hooks/use-leave-mutations.ts
 *
 * React Query mutation hooks for leave-related operations.
 *
 * This module provides mutation hooks for:
 * - Creating, updating, and deleting leave policies
 * - Adjusting leave balances
 * - Creating, updating, and managing leave requests
 * - Approving, rejecting, and delegating leave approvals
 * - Managing notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave-service';
import { leaveKeys } from '@/hooks/leave/use-leave';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import {
  CreateLeavePolicyRequest,
  UpdateLeavePolicyRequest,
  AdjustLeaveBalanceRequest,
  CreateLeaveRequestRequest,
  UpdateLeaveRequestRequest,
  LeaveApprovalAction,
  CalculateDays,
} from '@/types/leave';

// ==================== Leave Policy Mutations ====================

export const useCreateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLeavePolicyRequest) =>
      leaveService.createPolicy(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
      toast.success('Leave Policy Created', {
        description: 'The leave policy has been created successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Create Leave Policy'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyId,
      updates,
    }: {
      policyId: number;
      updates: UpdateLeavePolicyRequest;
    }) => leaveService.updatePolicy(policyId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policy(data.id) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
      toast.success('Leave Policy Updated', {
        description: 'The leave policy has been updated successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Leave Policy'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useDeleteLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policyId: number) => leaveService.deletePolicy(policyId),
    onSuccess: (_, policyId) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policy(policyId) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
      toast.success('Leave Policy Deleted', {
        description: 'The leave policy has been deleted.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Delete Leave Policy'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useActivateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policyId: number) => leaveService.activatePolicy(policyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policy(data.id) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
      toast.success('Leave Policy Activated', {
        description: 'The leave policy is now active.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Activate Leave Policy'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useDuplicateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyId,
      targetOrganizationId,
    }: {
      policyId: number;
      targetOrganizationId: number;
    }) => leaveService.duplicatePolicy(policyId, targetOrganizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
      toast.success('Leave Policy Duplicated', {
        description: 'A copy of the leave policy has been created.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Duplicate Leave Policy'), {
        description: getErrorMessage(err),
      }),
  });
};

// ==================== Leave Balance Mutations ====================

export const useRecalculateBalances = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) =>
      leaveService.recalculateBalances(employeeId),
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeBalances(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeBalanceSummary(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.transactions(employeeId),
      });
      toast.success('Balances Recalculated', {
        description: 'Leave balances have been recalculated successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Recalculate Balances'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useAdjustBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AdjustLeaveBalanceRequest) =>
      leaveService.adjustBalance(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeBalances(data.employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeePolicyBalance(
          data.employeeId,
          data.leavePolicyId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeBalanceSummary(data.employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.transactions(data.employeeId),
      });
      toast.success('Balance Adjusted', {
        description: 'The leave balance has been adjusted successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Adjust Balance'), {
        description: getErrorMessage(err),
      }),
  });
};

// ==================== Leave Request Mutations ====================

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLeaveRequestRequest) =>
      leaveService.createRequest(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeRequests(data.employeeId),
      });
      // Use partial keys to match all year variants
      queryClient.invalidateQueries({
        queryKey: [...leaveKeys.balances(), 'employee', data.employeeId],
      });
      toast.success('Leave Request Created', {
        description: 'Your leave request has been created.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Create Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      employeeId,
      dto,
    }: {
      requestId: number;
      employeeId: number;
      dto: UpdateLeaveRequestRequest;
    }) => leaveService.updateRequest(requestId, employeeId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(data.id) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeRequests(data.employeeId),
      });
      toast.success('Leave Request Updated', {
        description: 'The leave request has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useSubmitLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      requestId,
    }: {
      employeeId: number;
      requestId: number;
    }) => leaveService.submitRequest(employeeId, requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(data.id) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeRequests(data.employeeId),
      });
      // Use partial key to match all year variants
      queryClient.invalidateQueries({
        queryKey: [...leaveKeys.balances(), 'employee', data.employeeId],
      });
      // Invalidate pending approvals for potential approvers
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
      toast.success('Leave Request Submitted', {
        description: 'Your leave request has been submitted for approval.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Submit Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      employeeId,
      reason,
    }: {
      requestId: number;
      employeeId: number;
      reason?: string;
    }) => leaveService.cancelRequest(requestId, employeeId, reason),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      toast.success('Leave Request Cancelled', {
        description: 'The leave request has been cancelled.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Cancel Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useWithdrawLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) => leaveService.withdrawRequest(requestId),
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      toast.success('Leave Request Withdrawn', {
        description: 'The leave request has been withdrawn.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Withdraw Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useCheckConflicts = () => {
  return useMutation({
    mutationFn: ({
      employeeId,
      startDate,
      endDate,
    }: {
      employeeId: number;
      startDate: string;
      endDate: string;
    }) => leaveService.checkConflicts(employeeId, startDate, endDate),
  });
};

export const useCalculateDays = () => {
  return useMutation({
    mutationFn: (dto: CalculateDays) => leaveService.calculateDays(dto),
  });
};

// ==================== Leave Approval Mutations ====================

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      dto,
    }: {
      requestId: number;
      dto: LeaveApprovalAction;
    }) => leaveService.approveRequest(requestId, dto),
    onSuccess: (_, { requestId, dto }) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalHistory(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalChain(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.pendingApprovals(dto.approverId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.pendingApprovalsCount(dto.approverId),
      });
      queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.calendar() });
      toast.success('Leave Request Approved', {
        description: 'The leave request has been approved.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Approve Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useRejectLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      dto,
    }: {
      requestId: number;
      dto: LeaveApprovalAction;
    }) => leaveService.rejectRequest(requestId, dto),
    onSuccess: (_, { requestId, dto }) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalHistory(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalChain(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.pendingApprovals(dto.approverId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.pendingApprovalsCount(dto.approverId),
      });
      queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
      toast.success('Leave Request Rejected', {
        description: 'The leave request has been rejected.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Reject Leave Request'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useDelegateApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      dto,
    }: {
      requestId: number;
      dto: LeaveApprovalAction;
    }) => leaveService.delegateApproval(requestId, dto),
    onSuccess: (_, { requestId, dto }) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalHistory(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalChain(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.pendingApprovals(dto.approverId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.pendingApprovalsCount(dto.approverId),
      });
      if (dto.delegateToId) {
        queryClient.invalidateQueries({
          queryKey: leaveKeys.pendingApprovals(dto.delegateToId),
        });
        queryClient.invalidateQueries({
          queryKey: leaveKeys.pendingApprovalsCount(dto.delegateToId),
        });
      }
      toast.success('Approval Delegated', {
        description: 'The approval has been delegated successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Delegate Approval'), {
        description: getErrorMessage(err),
      }),
  });
};

// ==================== Notification Mutations ====================

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      leaveService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.notifications() });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) => leaveService.markAllAsRead(employeeId),
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeNotifications(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.unreadNotifications(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.unreadCount(employeeId),
      });
    },
  });
};
