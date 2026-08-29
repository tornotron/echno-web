/**
 * services/leave-service.ts
 *
 * Typed client for leave-related backend endpoints.
 *
 * This module wraps lower-level `api` calls and converts raw JSON into
 * strongly-typed domain objects via safe parsing helpers. It centralizes
 * parsing error handling (converted into `ApiError`) and provides a
 * comprehensive interface for the leave management system.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  LeavePolicy,
  parseLeavePolicy,
  CreateLeavePolicyRequest,
  createLeavePolicyToJson,
  UpdateLeavePolicyRequest,
  updateLeavePolicyToJson,
  LeaveBalance,
  parseLeaveBalance,
  parseLeaveBalanceSummary,
  LeaveBalanceSummary,
  LeaveTransaction,
  parseLeaveTransaction,
  AdjustLeaveBalanceRequest,
  LeaveRequest,
  parseLeaveRequest,
  CreateLeaveRequestRequest,
  UpdateLeaveRequestRequest,
  createLeaveRequestToJson,
  updateLeaveRequestToJson,
  CalculateDays,
  CalculateDaysResponse,
  ConflictCheckResponse,
  LeaveApproval,
  parseLeaveApproval,
  LeaveApprovalAction,
  approvalActionToJson,
  ApprovalChainResponse,
  CanApproveResponse,
  LeaveCalendarEntry,
  parseLeaveCalendarEntry,
  GroupedLeaveCalendarEntry,
  parseGroupedLeaveCalendarEntry,
  LeaveCountResponse,
  LeaveNotification,
  parseLeaveNotification,
  LeaveStatus,
} from '@/types/leave';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse leave policy with error handling.
 */
function safeParseLeavePolicy(data: ApiResponse): LeavePolicy {
  try {
    return parseLeavePolicy(data);
  } catch (error) {
    logger.error('Failed to parse leave policy data:', error);
    throw new ApiError(
      'Failed to process leave policy data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse leave policy array with error handling.
 */
function safeParseLeavePolicies(data: ApiResponse[]): LeavePolicy[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseLeavePolicy(item));
  } catch (error) {
    logger.error('Failed to parse leave policies data:', error);
    throw new ApiError(
      'Failed to process leave policies data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse leave balance with error handling.
 */
function safeParseLeaveBalance(data: ApiResponse): LeaveBalance {
  try {
    return parseLeaveBalance(data);
  } catch (error) {
    logger.error('Failed to parse leave balance data:', error);
    throw new ApiError(
      'Failed to process leave balance data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse leave balance array with error handling.
 */
function safeParseLeaveBalances(data: ApiResponse[]): LeaveBalance[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseLeaveBalance(item));
  } catch (error) {
    logger.error('Failed to parse leave balances data:', error);
    throw new ApiError(
      'Failed to process leave balances data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse leave request with error handling.
 */
function safeParseLeaveRequest(data: ApiResponse): LeaveRequest {
  try {
    return parseLeaveRequest(data);
  } catch (error) {
    logger.error('Failed to parse leave request data:', error);
    throw new ApiError(
      'Failed to process leave request data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse leave request array with error handling.
 */
function safeParseLeaveRequests(data: ApiResponse[]): LeaveRequest[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseLeaveRequest(item));
  } catch (error) {
    logger.error('Failed to parse leave requests data:', error);
    throw new ApiError(
      'Failed to process leave requests data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse leave approval array with error handling.
 */
function safeParseLeaveApprovals(data: ApiResponse[]): LeaveApproval[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseLeaveApproval(item));
  } catch (error) {
    logger.error('Failed to parse leave approvals data:', error);
    throw new ApiError(
      'Failed to process leave approvals data. Please try again.',
      422
    );
  }
}

/**
 * Leave Service
 *
 * Comprehensive service for managing leave policies, balances, requests,
 * approvals, calendar, and notifications.
 */
export const leaveService = {
  // ==================== Leave Policies ====================

  /**
   * Create a new leave policy.
   */
  async createPolicy(dto: CreateLeavePolicyRequest): Promise<LeavePolicy> {
    const data = await api.post<ApiResponse>(
      '/leave-policies/web',
      createLeavePolicyToJson(dto)
    );
    return safeParseLeavePolicy(data);
  },

  /**
   * Get leave policy by ID.
   */
  async getPolicyById(policyId: number): Promise<LeavePolicy> {
    const data = await api.get<ApiResponse>(`/leave-policies/web/policy`, {
      policyId,
    });
    return safeParseLeavePolicy(data);
  },

  /**
   * Get all leave policies.
   */
  async getAllPolicies(): Promise<LeavePolicy[]> {
    const data = await api.get<ApiResponse[]>('/leave-policies/web');
    return safeParseLeavePolicies(data);
  },

  /**
   * Get applicable policies for employee.
   */
  async getPoliciesByEmployee(employeeId: number): Promise<LeavePolicy[]> {
    const data = await api.get<ApiResponse[]>(`/leave-policies/web/employee`, {
      employeeId,
    });
    return safeParseLeavePolicies(data);
  },

  /**
   * Update leave policy.
   */
  async updatePolicy(
    policyId: number,
    updates: UpdateLeavePolicyRequest
  ): Promise<LeavePolicy> {
    const payload = updateLeavePolicyToJson(updates);
    const data = await api.patch<ApiResponse>(
      `/leave-policies/web/update`,
      payload,
      { policyId }
    );
    return safeParseLeavePolicy(data);
  },

  /**
   * Deactivate leave policy.
   */
  async deletePolicy(policyId: number): Promise<void> {
    await api.delete(`/leave-policies/web/deactivate`, { policyId });
  },

  /**
   * Reactivate leave policy.
   */
  async activatePolicy(policyId: number): Promise<LeavePolicy> {
    const data = await api.post<ApiResponse>(
      `/leave-policies/web/activate`,
      {},
      { policyId }
    );
    return safeParseLeavePolicy(data);
  },

  /**
   * Duplicate leave policy to another organization.
   */
  async duplicatePolicy(
    policyId: number,
    targetOrganizationId: number
  ): Promise<LeavePolicy> {
    const data = await api.post<ApiResponse>(
      `/leave-policies/web/duplicate`,
      {},
      { policyId, targetOrganizationId }
    );
    return safeParseLeavePolicy(data);
  },

  // ==================== Leave Balances ====================

  /**
   * Get all balances for employee.
   */
  async getEmployeeBalances(
    employeeId: number,
    year?: number
  ): Promise<LeaveBalance[]> {
    const params: Record<string, number> = { employeeId };
    if (year) params.year = year;
    const data = await api.get<ApiResponse[]>(`/leave-balances/web`, params);
    return safeParseLeaveBalances(data);
  },

  /**
   * Get specific balance for employee and policy.
   */
  async getEmployeePolicyBalance(
    employeeId: number,
    policyId: number,
    year?: number
  ): Promise<LeaveBalance> {
    const params: Record<string, number> = { employeeId, policyId };
    if (year) params.year = year;
    const data = await api.get<ApiResponse>(
      `/leave-balances/web/specific`,
      params
    );
    return safeParseLeaveBalance(data);
  },

  /**
   * Get balance summary with totals.
   */
  async getEmployeeBalanceSummary(
    employeeId: number,
    year?: number
  ): Promise<LeaveBalanceSummary> {
    const params: Record<string, number> = { employeeId };
    if (year) params.year = year;
    const data = await api.get<ApiResponse>(
      `/leave-balances/web/summary`,
      params
    );
    try {
      return parseLeaveBalanceSummary(data);
    } catch (error) {
      logger.error('Failed to parse leave balance summary:', error);
      throw new ApiError(
        'Failed to process leave balance summary. Please try again.',
        422
      );
    }
  },

  /**
   * Force recalculation of balances.
   */
  async recalculateBalances(employeeId: number, year?: number): Promise<void> {
    const params: Record<string, number> = { employeeId };
    if (year) params.year = year;
    await api.post(`/leave-balances/web/recalculate`, {}, params);
  },

  /**
   * Manual balance adjustment.
   */
  async adjustBalance(dto: AdjustLeaveBalanceRequest): Promise<LeaveBalance> {
    const data = await api.post<ApiResponse>('/leave-balances/web/adjust', dto);
    return safeParseLeaveBalance(data);
  },

  /**
   * Get transaction history by employee.
   */
  async getTransactionHistory(employeeId: number): Promise<LeaveTransaction[]> {
    const data = await api.get<ApiResponse[]>(
      `/leave-balances/web/transactions`,
      { employeeId }
    );
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveTransaction(item));
    } catch (error) {
      logger.error('Failed to parse leave transactions:', error);
      throw new ApiError(
        'Failed to process leave transactions. Please try again.',
        422
      );
    }
  },

  /**
   * Get transaction history by balance ID.
   */
  async getTransactionHistoryByBalanceId(
    balanceId: number
  ): Promise<LeaveTransaction[]> {
    const data = await api.get<ApiResponse[]>(
      `/leave-balances/web/transactions-by-balance`,
      { balanceId }
    );
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveTransaction(item));
    } catch (error) {
      logger.error('Failed to parse leave transactions:', error);
      throw new ApiError(
        'Failed to process leave transactions. Please try again.',
        422
      );
    }
  },

  // ==================== Leave Requests ====================

  /**
   * Create leave request.
   */
  async createRequest(dto: CreateLeaveRequestRequest): Promise<LeaveRequest> {
    const payload = createLeaveRequestToJson(dto);
    const data = await api.post<ApiResponse>('/leave-requests/web', payload, {
      employeeId: dto.employeeId,
    });
    return safeParseLeaveRequest(data);
  },

  /**
   * Get request details.
   */
  async getRequestById(requestId: number): Promise<LeaveRequest> {
    const data = await api.get<ApiResponse>(`/leave-requests/web/request`, {
      requestId,
    });
    return safeParseLeaveRequest(data);
  },

  /**
   * Get employee's requests (paginated).
   */
  async getEmployeeRequests(
    employeeId: number,
    page?: number,
    size?: number
  ): Promise<LeaveRequest[]> {
    const params: Record<string, number> = { employeeId };
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;

    const data = await api.get<ApiResponse[]>(
      `/leave-requests/web/employee`,
      params
    );
    return safeParseLeaveRequests(data);
  },

  /**
   * Filter employee requests by status.
   */
  async getEmployeeRequestsByStatus(
    employeeId: number,
    status: LeaveStatus
  ): Promise<LeaveRequest[]> {
    const data = await api.get<ApiResponse[]>(
      `/leave-requests/web/employee-by-status`,
      { employeeId, status }
    );
    return safeParseLeaveRequests(data);
  },

  /**
   * Get organization requests (paginated).
   */
  async getOrganizationRequests(
    page?: number,
    size?: number
  ): Promise<LeaveRequest[]> {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;

    const data = await api.get<ApiResponse[]>(
      `/leave-requests/web/organization`,
      Object.keys(params).length > 0 ? params : undefined
    );
    return safeParseLeaveRequests(data);
  },

  /**
   * Get all leave requests for an approver.
   */
  async getApproverRequests(approverId: number): Promise<LeaveRequest[]> {
    const data = await api.get<ApiResponse[]>(`/leave-requests/web/approver`, {
      approverId,
    });
    return safeParseLeaveRequests(data);
  },

  /**
   * Get pending approvals for approver.
   */
  async getPendingApprovals(approverId: number): Promise<LeaveRequest[]> {
    const data = await api.get<ApiResponse[]>(
      `/leave-requests/web/pending-approvals`,
      { approverId }
    );
    return safeParseLeaveRequests(data);
  },

  /**
   * Get pending approvals count.
   */
  async getPendingApprovalsCount(approverId: number): Promise<number> {
    const data = await api.get<{ count: number }>(
      `/leave-requests/web/pending-approvals/count`,
      { approverId }
    );
    return data.count ?? 0;
  },

  /**
   * Update draft request.
   */
  async updateRequest(
    requestId: number,
    employeeId: number,
    dto: UpdateLeaveRequestRequest
  ): Promise<LeaveRequest> {
    const payload = updateLeaveRequestToJson(dto);
    const data = await api.patch<ApiResponse>(
      `/leave-requests/web/update`,
      payload,
      { requestId, employeeId }
    );
    return safeParseLeaveRequest(data);
  },

  /**
   * Submit request for approval.
   */
  async submitRequest(
    employeeId: number,
    requestId: number
  ): Promise<LeaveRequest> {
    const data = await api.post<ApiResponse>(
      `/leave-requests/web/employeeId/${employeeId}/submit`,
      {},
      { requestId }
    );
    return safeParseLeaveRequest(data);
  },

  /**
   * Cancel request.
   */
  async cancelRequest(
    requestId: number,
    employeeId: number,
    reason?: string
  ): Promise<void> {
    await api.post(
      `/leave-requests/web/cancel`,
      { reason },
      { requestId, employeeId }
    );
  },

  /**
   * Withdraws a request the employee has not had acted on yet.
   *
   * The mapping is `POST /leave-requests/web/employeeId/{employeeId}/withdraw`
   * with `requestId` as a query param, the same shape as `submitRequest`, and
   * `employeeId` is a path variable rather than a query param because
   * `@PreAuthorize("@orgSecurity.isSelfInCurrentTenant(#employeeId)")` reads it
   * from the path. It cannot be omitted: without it the request does not reach
   * the mapping at all.
   *
   * Returns the withdrawn request, which the backend responds with, so callers
   * can patch their caches rather than invalidate blind.
   */
  async withdrawRequest(
    requestId: number,
    employeeId: number
  ): Promise<LeaveRequest> {
    const data = await api.post<ApiResponse>(
      `/leave-requests/web/employeeId/${employeeId}/withdraw`,
      {},
      { requestId }
    );
    return safeParseLeaveRequest(data);
  },

  /**
   * Check for conflicts.
   */
  async checkConflicts(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<ConflictCheckResponse> {
    const data = await api.get<ApiResponse>(`/leave-requests/web/conflicts`, {
      employeeId,
      startDate,
      endDate,
    });
    return {
      hasConflict: data.hasConflict ?? false,
      conflictingRequests: data.conflictingRequests
        ? safeParseLeaveRequests(data.conflictingRequests)
        : [],
    };
  },

  /**
   * Calculate total days.
   */
  async calculateDays(dto: CalculateDays): Promise<CalculateDaysResponse> {
    const data = await api.post<ApiResponse>(
      '/leave-requests/web/calculate-days',
      dto
    );
    return {
      totalDays: data.totalDays ?? 0,
    };
  },

  // ==================== Leave Approvals ====================

  /**
   * Approve request.
   */
  async approveRequest(
    requestId: number,
    dto: LeaveApprovalAction
  ): Promise<void> {
    const payload = approvalActionToJson(dto);
    await api.post(`/leave-approvals/web/approve`, payload, { requestId });
  },

  /**
   * Reject request.
   */
  async rejectRequest(
    requestId: number,
    dto: LeaveApprovalAction
  ): Promise<void> {
    const payload = approvalActionToJson(dto);
    await api.post(`/leave-approvals/web/reject`, payload, { requestId });
  },

  /**
   * Delegate approval.
   */
  async delegateApproval(
    requestId: number,
    dto: LeaveApprovalAction
  ): Promise<void> {
    const payload = approvalActionToJson(dto);
    await api.post(`/leave-approvals/web/delegate`, payload, { requestId });
  },

  /**
   * Get approval history.
   */
  async getApprovalHistory(requestId: number): Promise<LeaveApproval[]> {
    const data = await api.get<ApiResponse[]>(`/leave-approvals/web/history`, {
      requestId,
    });
    return safeParseLeaveApprovals(data);
  },

  /**
   * Get full approval chain.
   */
  async getApprovalChain(requestId: number): Promise<ApprovalChainResponse> {
    const data = await api.get<ApiResponse>(`/leave-approvals/web/chain`, {
      requestId,
    });
    return {
      requestId: data.requestId ?? requestId,
      approvals: data.approvals ? safeParseLeaveApprovals(data.approvals) : [],
    };
  },

  /**
   * Check if can approve.
   */
  async canApprove(
    requestId: number,
    employeeId: number
  ): Promise<CanApproveResponse> {
    const data = await api.get<ApiResponse>(
      `/leave-approvals/web/can-approve`,
      { requestId, employeeId }
    );
    return {
      canApprove: data.canApprove ?? false,
      reason: data.reason,
    };
  },

  // ==================== Leave Calendar ====================

  /**
   * Get organization calendar.
   */
  async getOrganizationCalendar(
    organizationId: number,
    startDate: string,
    endDate: string
  ): Promise<LeaveCalendarEntry[]> {
    const data = await api.get<ApiResponse[]>(
      `/leave-calendar/web/organization`,
      { organizationId, startDate, endDate }
    );
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveCalendarEntry(item));
    } catch (error) {
      logger.error('Failed to parse leave calendar entries:', error);
      throw new ApiError(
        'Failed to process leave calendar. Please try again.',
        422
      );
    }
  },

  /**
   * Get department calendar.
   */
  async getDepartmentCalendar(
    organizationId: number,
    department: string,
    startDate: string,
    endDate: string
  ): Promise<LeaveCalendarEntry[]> {
    const data = await api.get<ApiResponse[]>(
      `/leave-calendar/web/department`,
      { organizationId, department, startDate, endDate }
    );
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveCalendarEntry(item));
    } catch (error) {
      logger.error('Failed to parse department calendar entries:', error);
      throw new ApiError(
        'Failed to process department calendar. Please try again.',
        422
      );
    }
  },

  /**
   * Get employee calendar.
   */
  async getEmployeeCalendar(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<LeaveCalendarEntry[]> {
    const data = await api.get<ApiResponse[]>(`/leave-calendar/web/employee`, {
      employeeId,
      startDate,
      endDate,
    });
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveCalendarEntry(item));
    } catch (error) {
      logger.error('Failed to parse employee calendar entries:', error);
      throw new ApiError(
        'Failed to process employee calendar. Please try again.',
        422
      );
    }
  },

  /**
   * Get team calendar.
   */
  async getTeamCalendar(
    managerId: number,
    startDate: string,
    endDate: string
  ): Promise<LeaveCalendarEntry[]> {
    const data = await api.get<ApiResponse[]>(`/leave-calendar/web/team`, {
      managerId,
      startDate,
      endDate,
    });
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveCalendarEntry(item));
    } catch (error) {
      logger.error('Failed to parse team calendar entries:', error);
      throw new ApiError(
        'Failed to process team calendar. Please try again.',
        422
      );
    }
  },

  /**
   * Get grouped calendar.
   */
  async getGroupedCalendar(
    organizationId: number,
    startDate: string,
    endDate: string
  ): Promise<GroupedLeaveCalendarEntry[]> {
    const data = await api.get<ApiResponse[]>(`/leave-calendar/web/grouped`, {
      organizationId,
      startDate,
      endDate,
    });
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseGroupedLeaveCalendarEntry(item));
    } catch (error) {
      logger.error('Failed to parse grouped calendar entries:', error);
      throw new ApiError(
        'Failed to process grouped calendar. Please try again.',
        422
      );
    }
  },

  /**
   * Get count on leave.
   */
  async getLeaveCount(
    organizationId: number,
    date: string
  ): Promise<LeaveCountResponse> {
    const data = await api.get<ApiResponse>(`/leave-calendar/web/count`, {
      organizationId,
      date,
    });
    return {
      date: data.date ? new Date(data.date) : new Date(date),
      count: data.count ?? 0,
    };
  },

  // ==================== Notifications ====================

  /**
   * Get notifications (paginated).
   */
  async getNotifications(
    employeeId: number,
    page?: number,
    size?: number
  ): Promise<LeaveNotification[]> {
    const params: Record<string, number> = { employeeId };
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;

    const data = await api.get<ApiResponse[]>(`/notifications/web`, params);
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveNotification(item));
    } catch (error) {
      logger.error('Failed to parse leave notifications:', error);
      throw new ApiError(
        'Failed to process notifications. Please try again.',
        422
      );
    }
  },

  /**
   * Get unread notifications.
   */
  async getUnreadNotifications(
    employeeId: number
  ): Promise<LeaveNotification[]> {
    const data = await api.get<ApiResponse[]>(`/notifications/web/unread`, {
      employeeId,
    });
    if (!Array.isArray(data)) return [];
    try {
      return data.map((item) => parseLeaveNotification(item));
    } catch (error) {
      logger.error('Failed to parse unread notifications:', error);
      throw new ApiError(
        'Failed to process unread notifications. Please try again.',
        422
      );
    }
  },

  /**
   * Get unread notifications count.
   */
  async getUnreadCount(employeeId: number): Promise<number> {
    const data = await api.get<{ count: number }>(
      `/notifications/web/unread-count`,
      { employeeId }
    );
    return data.count ?? 0;
  },

  /**
   * Mark notification as read.
   */
  async markAsRead(notificationId: number): Promise<void> {
    await api.patch(`/notifications/web/read`, {}, { notificationId });
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(employeeId: number): Promise<void> {
    await api.post(`/notifications/web/mark-all-read`, {}, { employeeId });
  },
};
