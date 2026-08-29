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
import type {
  LeavePolicy,
  LeaveRequest,
  LeaveNotification,
} from '@/types/leave';
import {
  CreateLeavePolicyRequest,
  UpdateLeavePolicyRequest,
  AdjustLeaveBalanceRequest,
  CreateLeaveRequestRequest,
  UpdateLeaveRequestRequest,
  LeaveApprovalAction,
  CalculateDays,
} from '@/types/leave';

/**
 * Matches every LeavePolicy[] list cache under the 'leave/policies' namespace,
 * including `policies()` and `policiesByEmployee(id)`. Used by `setQueriesData`
 * to batch-patch all policy list views.
 */
function isLeavePolicyListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key[0] === 'leave' &&
    key[1] === 'policies' &&
    // Exclude `policy(id)` shape: ['leave', 'policies', <number>]
    typeof key[2] !== 'number'
  );
}

/**
 * Matches every LeaveRequest[] list cache under the 'leave/requests' namespace.
 *
 * Explicitly excludes:
 *   - `request(id)` detail caches (numeric third segment),
 *   - `pendingApprovals(approverId)` and `pendingApprovalsCount(approverId)`
 *     caches — those are managed by approval mutations, and the count cache
 *     stores a number (not a LeaveRequest[]), so blindly patching it would
 *     throw at runtime.
 */
function isLeaveRequestListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  if (
    !Array.isArray(key) ||
    key[0] !== 'leave' ||
    key[1] !== 'requests' ||
    typeof key[2] === 'number'
  ) {
    return false;
  }
  // pendingApprovals → ['leave', 'requests', 'pending', approverId]
  // pendingApprovalsCount → ['leave', 'requests', 'pending', approverId, 'count']
  if (key[2] === 'pending') return false;
  // Defensive: ignore any future count-style key under the requests namespace.
  if (key.includes('count')) return false;
  return true;
}

/**
 * Removes a leave request from the approver's `pendingApprovals` list cache
 * and decrements the `pendingApprovalsCount` cache by 1. Used by approve /
 * reject / delegate `onSuccess` so the approver dashboard updates instantly
 * without a refetch.
 */
function patchPendingApprovalRemoval(
  queryClient: ReturnType<typeof useQueryClient>,
  approverId: number,
  requestId: number
): void {
  queryClient.setQueryData<LeaveRequest[]>(
    leaveKeys.pendingApprovals(approverId),
    (old) => old?.filter((r) => r.id !== requestId)
  );
  patchPendingApprovalCountDelta(queryClient, approverId, -1);
}

/**
 * Increments / decrements the cached `pendingApprovalsCount` for an approver.
 * No-op if the count isn't cached (functional updater returns undefined).
 */
function patchPendingApprovalCountDelta(
  queryClient: ReturnType<typeof useQueryClient>,
  approverId: number,
  delta: number
): void {
  queryClient.setQueryData<number>(
    leaveKeys.pendingApprovalsCount(approverId),
    (old) => (typeof old === 'number' ? Math.max(0, old + delta) : undefined)
  );
}

// ==================== Leave Policy Mutations ====================

export const useCreateLeavePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLeavePolicyRequest) =>
      leaveService.createPolicy(dto),
    onSuccess: (newPolicy) => {
      // POST /leave-policies/web → LeavePolicyDto (full).
      // Seed detail + append to lists; no follow-up refetch needed.
      queryClient.setQueryData(leaveKeys.policy(newPolicy.id), newPolicy);
      queryClient.setQueryData<LeavePolicy[]>(leaveKeys.policies(), (old) =>
        old ? [...old, newPolicy] : [newPolicy]
      );
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
      // PATCH /leave-policies/web/update → LeavePolicyDto (full).
      // Patch detail + every policy-list cache directly; no invalidations needed.
      queryClient.setQueryData(leaveKeys.policy(data.id), data);
      queryClient.setQueriesData<LeavePolicy[]>(
        { predicate: isLeavePolicyListCache },
        (old) => old?.map((p) => (p.id === data.id ? data : p))
      );
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
      // DELETE /leave-policies/web/deactivate → ApiResponse (ack).
      // Entity removed — evict detail and filter from list caches.
      queryClient.removeQueries({ queryKey: leaveKeys.policy(policyId) });
      queryClient.setQueriesData<LeavePolicy[]>(
        { predicate: isLeavePolicyListCache },
        (old) => old?.filter((p) => p.id !== policyId)
      );
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
      // POST /leave-policies/web/activate → ApiResponse (ack) per spec, but
      // leaveService.activatePolicy parses the response as LeavePolicy. If
      // the spec is correct, `data` may be empty/malformed; fall back to
      // invalidate when patching with `data` isn't viable.
      // FIXME: confirm backend response shape; update service signature
      // (Promise<void>) if spec is authoritative.
      if (data && typeof data.id === 'number') {
        queryClient.setQueryData(leaveKeys.policy(data.id), data);
        queryClient.setQueriesData<LeavePolicy[]>(
          { predicate: isLeavePolicyListCache },
          (old) => old?.map((p) => (p.id === data.id ? data : p))
        );
      } else {
        queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
      }
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
    onSuccess: (newPolicy) => {
      // POST /leave-policies/web/duplicate → LeavePolicyDto (full).
      // Seed detail + append to lists; same pattern as create.
      queryClient.setQueryData(leaveKeys.policy(newPolicy.id), newPolicy);
      queryClient.setQueryData<LeavePolicy[]>(leaveKeys.policies(), (old) =>
        old ? [...old, newPolicy] : [newPolicy]
      );
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
      // POST /leave-balances/web/recalculate → LeaveBalanceDto per spec, but
      // leaveService.recalculateBalances returns Promise<void> (discarded).
      // Balances are server-recomputed; targeted invalidation is the right tool.
      // Scoped to this employee — other employees' caches stay warm.
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
      // POST /leave-balances/web/adjust → LeaveTransactionDto per spec; the
      // service parses as LeaveBalance (returns the updated balance for the
      // adjusted policy). Patch the policy-specific balance directly; invalidate
      // the rollups (summary + transactions list) since server recomputes them.
      queryClient.setQueryData(
        leaveKeys.employeePolicyBalance(data.employeeId, data.leavePolicyId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: leaveKeys.employeeBalances(data.employeeId),
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
      // POST /leave-requests/web → LeaveRequestDto (full).
      // Seed detail + append to every request list cache via predicate. Balance
      // recompute happens server-side; scope invalidation to this employee.
      queryClient.setQueryData(leaveKeys.request(data.id), data);
      queryClient.setQueriesData<LeaveRequest[]>(
        { predicate: isLeaveRequestListCache },
        (old) => (old ? [...old, data] : undefined)
      );
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
      // PATCH /leave-requests/web/update → LeaveRequestDto (full).
      // Patch detail + every request-list cache directly; no invalidations.
      queryClient.setQueryData(leaveKeys.request(data.id), data);
      queryClient.setQueriesData<LeaveRequest[]>(
        { predicate: isLeaveRequestListCache },
        (old) => old?.map((r) => (r.id === data.id ? data : r))
      );
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
      // POST /leave-requests/web/employeeId/{employeeId}/submit → LeaveRequestDto (full).
      // Patch detail + lists; balance recompute is server-side; pending
      // approvals are scoped per approver and the approver set is opaque to
      // this employee context — invalidate the request-list namespace to
      // refresh approver views.
      queryClient.setQueryData(leaveKeys.request(data.id), data);
      queryClient.setQueriesData<LeaveRequest[]>(
        { predicate: isLeaveRequestListCache },
        (old) => old?.map((r) => (r.id === data.id ? data : r))
      );
      queryClient.invalidateQueries({
        queryKey: [...leaveKeys.balances(), 'employee', data.employeeId],
      });
      // Keep: approvers are not known from this context.
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
    onSuccess: (_data, { requestId, employeeId }) => {
      // POST /leave-requests/web/cancel → LeaveRequestDto per spec, but
      // leaveService.cancelRequest returns Promise<void>.
      // FIXME: capture the response and patch caches like useUpdateLeaveRequest.
      // For now, scope-narrow the invalidations to this employee.
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({ predicate: isLeaveRequestListCache });
      queryClient.invalidateQueries({
        queryKey: [...leaveKeys.balances(), 'employee', employeeId],
      });
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
    mutationFn: ({
      requestId,
      employeeId,
    }: {
      requestId: number;
      employeeId: number;
    }) => leaveService.withdrawRequest(requestId, employeeId),
    onSuccess: (data, { employeeId }) => {
      // The backend responds with the withdrawn LeaveRequestDto, so patch the
      // detail and the lists rather than invalidating them, the way
      // useUpdateLeaveRequest does.
      queryClient.setQueryData(leaveKeys.request(data.id), data);
      queryClient.setQueriesData<LeaveRequest[]>(
        { predicate: isLeaveRequestListCache },
        (old) => old?.map((r) => (r.id === data.id ? data : r))
      );
      // Withdrawing a pending request releases the days it had reserved, and
      // the recomputation is server side, so the balance has to be refetched.
      queryClient.invalidateQueries({
        queryKey: [...leaveKeys.balances(), 'employee', employeeId],
      });
      // Keep: the request leaves the approver's queue and the approver set is
      // not known from this context.
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
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
    onSuccess: (_data, { requestId, dto }) => {
      // POST /leave-approvals/web/approve → LeaveRequestDto per spec, but
      // leaveService.approveRequest returns Promise<void>.
      // FIXME: capture the response, patch leaveKeys.request(data.id) and
      // the lists. For now, patch what we know deterministically:
      // remove from this approver's pending list and decrement the count.
      patchPendingApprovalRemoval(queryClient, dto.approverId, requestId);
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalHistory(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalChain(requestId),
      });
      // Keep: balance recompute + calendar are server-side / cross-employee.
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
    onSuccess: (_data, { requestId, dto }) => {
      // POST /leave-approvals/web/reject → LeaveRequestDto per spec.
      // Same shape as approve: decrement pending count, remove from pending list.
      patchPendingApprovalRemoval(queryClient, dto.approverId, requestId);
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalHistory(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalChain(requestId),
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
    onSuccess: (_data, { requestId, dto }) => {
      // POST /leave-approvals/web/delegate → LeaveRequestDto per spec.
      // Removes from current approver, conditionally adds to delegate target.
      patchPendingApprovalRemoval(queryClient, dto.approverId, requestId);
      queryClient.invalidateQueries({ queryKey: leaveKeys.request(requestId) });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalHistory(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveKeys.approvalChain(requestId),
      });
      if (dto.delegateToId !== undefined) {
        // Bump the delegate's count by 1 if it's cached; their pending list
        // requires the full LeaveRequest entity to append, which we don't have
        // until the service captures the response. Invalidate as fallback.
        patchPendingApprovalCountDelta(queryClient, dto.delegateToId, +1);
        queryClient.invalidateQueries({
          queryKey: leaveKeys.pendingApprovals(dto.delegateToId),
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
    // Accept employeeId in addition to id so we can patch the employee's
    // notification list, unread list, and unread count directly.
    mutationFn: ({
      notificationId,
    }: {
      notificationId: number;
      employeeId: number;
    }) => leaveService.markAsRead(notificationId),
    onSuccess: (_, { notificationId, employeeId }) => {
      // POST notifications/{id}/read → void.
      // Remove from unread list, decrement count, flag the entry in the
      // full employee list as read. No invalidations needed for the happy path.
      queryClient.setQueryData<LeaveNotification[]>(
        leaveKeys.unreadNotifications(employeeId),
        (old) => old?.filter((n) => n.id !== notificationId)
      );
      queryClient.setQueryData<number>(
        leaveKeys.unreadCount(employeeId),
        (old) => (typeof old === 'number' ? Math.max(0, old - 1) : undefined)
      );
      // Patch the entry in any paginated employee notifications cache; predicate
      // since key shape includes pagination params.
      queryClient.setQueriesData<LeaveNotification[]>(
        {
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'leave' &&
            q.queryKey[1] === 'notifications' &&
            q.queryKey[2] === employeeId,
        },
        (old) =>
          old?.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
      );
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) => leaveService.markAllAsRead(employeeId),
    onSuccess: (_, employeeId) => {
      // POST notifications/read-all → void.
      // Clear unread list, zero the count, mark all entries in the paginated
      // employee notifications cache as read.
      queryClient.setQueryData<LeaveNotification[]>(
        leaveKeys.unreadNotifications(employeeId),
        []
      );
      queryClient.setQueryData<number>(leaveKeys.unreadCount(employeeId), 0);
      queryClient.setQueriesData<LeaveNotification[]>(
        {
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'leave' &&
            q.queryKey[1] === 'notifications' &&
            q.queryKey[2] === employeeId,
        },
        (old) => old?.map((n) => ({ ...n, isRead: true }))
      );
    },
  });
};
