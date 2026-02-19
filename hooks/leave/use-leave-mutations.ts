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
import {
  LeavePolicyCreation,
  LeavePolicy,
  LeaveBalanceAdjustment,
  LeaveRequestCreation,
  LeaveRequestUpdate,
  LeaveApprovalAction,
  CalculateDays,
} from '@/types/leave';

// ==================== Leave Policy Mutations ====================

export const useCreateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LeavePolicyCreation) => leaveService.createPolicy(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
    },
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
      updates: Partial<LeavePolicy>;
    }) => leaveService.updatePolicy(policyId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policy(data.id) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
    },
  });
};

export const useDeleteLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policyId: number) => leaveService.deletePolicy(policyId),
    onSuccess: (_, policyId) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policy(policyId) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
    },
  });
};

export const useActivateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policyId: number) => leaveService.activatePolicy(policyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policy(data.id) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
    },
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
    },
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
    },
  });
};

export const useAdjustBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LeaveBalanceAdjustment) =>
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
    },
  });
};

// ==================== Leave Request Mutations ====================

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LeaveRequestCreation) => leaveService.createRequest(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeRequests(data.employeeId),
      });
      // Use partial keys to match all year variants
      queryClient.invalidateQueries({
        queryKey: [...leaveKeys.balances(), 'employee', data.employeeId],
      });
    },
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
      dto: LeaveRequestUpdate;
    }) => leaveService.updateRequest(requestId, employeeId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(data.id) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeRequests(data.employeeId),
      });
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
