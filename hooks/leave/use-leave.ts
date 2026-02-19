/**
 * lib/hooks/use-leave.ts
 *
 * React Query hooks for fetching leave-related data.
 *
 * This module provides query hooks for:
 * - Leave policies
 * - Leave balances
 * - Leave requests
 * - Leave approvals
 * - Leave calendar
 * - Leave notifications
 */

import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/services/leave-service';
import { LeaveStatus } from '@/types/leave';

// ==================== Query Keys ====================

export const leaveKeys = {
  all: ['leave'] as const,

  // Leave Policies
  policies: () => [...leaveKeys.all, 'policies'] as const,
  policy: (id: number) => [...leaveKeys.policies(), id] as const,
  policiesByEmployee: (employeeId: number) =>
    [...leaveKeys.policies(), 'employee', employeeId] as const,

  // Leave Balances
  balances: () => [...leaveKeys.all, 'balances'] as const,
  employeeBalances: (employeeId: number, year?: number) =>
    [...leaveKeys.balances(), 'employee', employeeId, year] as const,
  employeePolicyBalance: (employeeId: number, policyId: number) =>
    [
      ...leaveKeys.balances(),
      'employee',
      employeeId,
      'policy',
      policyId,
    ] as const,
  employeeBalanceSummary: (employeeId: number, year?: number) =>
    [...leaveKeys.balances(), 'employee', employeeId, 'summary', year] as const,
  transactions: (employeeId: number) =>
    [...leaveKeys.balances(), 'transactions', employeeId] as const,

  // Leave Requests
  requests: () => [...leaveKeys.all, 'requests'] as const,
  request: (id: number) => [...leaveKeys.requests(), id] as const,
  employeeRequests: (employeeId: number, page?: number, size?: number) =>
    [...leaveKeys.requests(), 'employee', employeeId, { page, size }] as const,
  employeeRequestsByStatus: (employeeId: number, status: LeaveStatus) =>
    [
      ...leaveKeys.requests(),
      'employee',
      employeeId,
      'status',
      status,
    ] as const,
  organizationRequests: (page?: number, size?: number) =>
    [...leaveKeys.requests(), 'organization', { page, size }] as const,
  approverRequests: (approverId: number) =>
    [...leaveKeys.requests(), 'approver', approverId] as const,
  pendingApprovals: (approverId: number) =>
    [...leaveKeys.requests(), 'pending', approverId] as const,
  pendingApprovalsCount: (approverId: number) =>
    [...leaveKeys.requests(), 'pending', approverId, 'count'] as const,

  // Leave Approvals
  approvals: () => [...leaveKeys.all, 'approvals'] as const,
  approvalHistory: (requestId: number) =>
    [...leaveKeys.approvals(), 'history', requestId] as const,
  approvalChain: (requestId: number) =>
    [...leaveKeys.approvals(), 'chain', requestId] as const,
  canApprove: (requestId: number, employeeId: number) =>
    [...leaveKeys.approvals(), 'can-approve', requestId, employeeId] as const,

  // Leave Calendar
  calendar: () => [...leaveKeys.all, 'calendar'] as const,
  organizationCalendar: (orgId: number, startDate: string, endDate: string) =>
    [
      ...leaveKeys.calendar(),
      'organization',
      orgId,
      startDate,
      endDate,
    ] as const,
  departmentCalendar: (
    orgId: number,
    department: string,
    startDate: string,
    endDate: string
  ) =>
    [
      ...leaveKeys.calendar(),
      'department',
      orgId,
      department,
      startDate,
      endDate,
    ] as const,
  employeeCalendar: (employeeId: number, startDate: string, endDate: string) =>
    [
      ...leaveKeys.calendar(),
      'employee',
      employeeId,
      startDate,
      endDate,
    ] as const,
  teamCalendar: (managerId: number, startDate: string, endDate: string) =>
    [...leaveKeys.calendar(), 'team', managerId, startDate, endDate] as const,
  groupedCalendar: (orgId: number, startDate: string, endDate: string) =>
    [...leaveKeys.calendar(), 'grouped', orgId, startDate, endDate] as const,
  leaveCount: (orgId: number, date: string) =>
    [...leaveKeys.calendar(), 'count', orgId, date] as const,

  // Notifications
  notifications: () => [...leaveKeys.all, 'notifications'] as const,
  employeeNotifications: (employeeId: number, page?: number, size?: number) =>
    [...leaveKeys.notifications(), employeeId, { page, size }] as const,
  unreadNotifications: (employeeId: number) =>
    [...leaveKeys.notifications(), 'unread', employeeId] as const,
  unreadCount: (employeeId: number) =>
    [...leaveKeys.notifications(), 'unread-count', employeeId] as const,
};

// ==================== Leave Policy Hooks ====================

export const useLeavePolicy = (policyId: number) => {
  return useQuery({
    queryKey: leaveKeys.policy(policyId),
    queryFn: () => leaveService.getPolicyById(policyId),
    enabled: !!policyId,
  });
};

export const useAllLeavePolicies = () => {
  return useQuery({
    queryKey: leaveKeys.policies(),
    queryFn: () => leaveService.getAllPolicies(),
  });
};

export const useLeavePoliciesByEmployee = (employeeId: number) => {
  return useQuery({
    queryKey: leaveKeys.policiesByEmployee(employeeId),
    queryFn: () => leaveService.getPoliciesByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

// ==================== Leave Balance Hooks ====================

export const useEmployeeBalances = (employeeId: number, year?: number) => {
  return useQuery({
    queryKey: leaveKeys.employeeBalances(employeeId, year),
    queryFn: () => leaveService.getEmployeeBalances(employeeId, year),
    enabled: !!employeeId,
  });
};

export const useEmployeePolicyBalance = (
  employeeId: number,
  policyId: number
) => {
  return useQuery({
    queryKey: leaveKeys.employeePolicyBalance(employeeId, policyId),
    queryFn: () => leaveService.getEmployeePolicyBalance(employeeId, policyId),
    enabled: !!employeeId && !!policyId,
  });
};

export const useEmployeeBalanceSummary = (
  employeeId: number,
  year?: number
) => {
  return useQuery({
    queryKey: leaveKeys.employeeBalanceSummary(employeeId, year),
    queryFn: () => leaveService.getEmployeeBalanceSummary(employeeId, year),
    enabled: !!employeeId,
  });
};

export const useTransactionHistory = (employeeId: number) => {
  return useQuery({
    queryKey: leaveKeys.transactions(employeeId),
    queryFn: () => leaveService.getTransactionHistory(employeeId),
    enabled: !!employeeId,
  });
};

// ==================== Leave Request Hooks ====================

export const useLeaveRequest = (requestId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: leaveKeys.request(requestId),
    queryFn: () => leaveService.getRequestById(requestId),
    enabled: !!requestId && enabled,
  });
};

export const useEmployeeRequests = (
  employeeId: number,
  page?: number,
  size?: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: leaveKeys.employeeRequests(employeeId, page, size),
    queryFn: () => leaveService.getEmployeeRequests(employeeId, page, size),
    enabled: !!employeeId && enabled,
  });
};

export const useEmployeeRequestsByStatus = (
  employeeId: number,
  status: LeaveStatus
) => {
  return useQuery({
    queryKey: leaveKeys.employeeRequestsByStatus(employeeId, status),
    queryFn: () => leaveService.getEmployeeRequestsByStatus(employeeId, status),
    enabled: !!employeeId && !!status,
  });
};

export const useOrganizationRequests = (page?: number, size?: number) => {
  return useQuery({
    queryKey: leaveKeys.organizationRequests(page, size),
    queryFn: () => leaveService.getOrganizationRequests(page, size),
  });
};

export const useApproverRequests = (approverId: number) => {
  return useQuery({
    queryKey: leaveKeys.approverRequests(approverId),
    queryFn: () => leaveService.getApproverRequests(approverId),
    enabled: !!approverId,
  });
};

export const usePendingApprovals = (approverId: number) => {
  return useQuery({
    queryKey: leaveKeys.pendingApprovals(approverId),
    queryFn: () => leaveService.getPendingApprovals(approverId),
    enabled: !!approverId,
  });
};

export const usePendingApprovalsCount = (approverId: number) => {
  return useQuery({
    queryKey: leaveKeys.pendingApprovalsCount(approverId),
    queryFn: () => leaveService.getPendingApprovalsCount(approverId),
    enabled: !!approverId,
  });
};

// ==================== Leave Approval Hooks ====================

export const useApprovalHistory = (
  requestId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: leaveKeys.approvalHistory(requestId),
    queryFn: () => leaveService.getApprovalHistory(requestId),
    enabled: !!requestId && enabled,
  });
};

export const useApprovalChain = (requestId: number) => {
  return useQuery({
    queryKey: leaveKeys.approvalChain(requestId),
    queryFn: () => leaveService.getApprovalChain(requestId),
    enabled: !!requestId,
  });
};

export const useCanApprove = (
  requestId: number,
  employeeId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: leaveKeys.canApprove(requestId, employeeId),
    queryFn: () => leaveService.canApprove(requestId, employeeId),
    enabled: !!requestId && !!employeeId && enabled,
  });
};

// ==================== Leave Calendar Hooks ====================

export const useOrganizationCalendar = (
  organizationId: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: leaveKeys.organizationCalendar(
      organizationId,
      startDate,
      endDate
    ),
    queryFn: () =>
      leaveService.getOrganizationCalendar(organizationId, startDate, endDate),
    enabled: !!organizationId && !!startDate && !!endDate,
  });
};

export const useDepartmentCalendar = (
  organizationId: number,
  department: string,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: leaveKeys.departmentCalendar(
      organizationId,
      department,
      startDate,
      endDate
    ),
    queryFn: () =>
      leaveService.getDepartmentCalendar(
        organizationId,
        department,
        startDate,
        endDate
      ),
    enabled: !!organizationId && !!department && !!startDate && !!endDate,
  });
};

export const useEmployeeCalendar = (
  employeeId: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: leaveKeys.employeeCalendar(employeeId, startDate, endDate),
    queryFn: () =>
      leaveService.getEmployeeCalendar(employeeId, startDate, endDate),
    enabled: !!employeeId && !!startDate && !!endDate,
  });
};

export const useTeamCalendar = (
  managerId: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: leaveKeys.teamCalendar(managerId, startDate, endDate),
    queryFn: () => leaveService.getTeamCalendar(managerId, startDate, endDate),
    enabled: !!managerId && !!startDate && !!endDate,
  });
};

export const useGroupedCalendar = (
  organizationId: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: leaveKeys.groupedCalendar(organizationId, startDate, endDate),
    queryFn: () =>
      leaveService.getGroupedCalendar(organizationId, startDate, endDate),
    enabled: !!organizationId && !!startDate && !!endDate,
  });
};

export const useLeaveCount = (organizationId: number, date: string) => {
  return useQuery({
    queryKey: leaveKeys.leaveCount(organizationId, date),
    queryFn: () => leaveService.getLeaveCount(organizationId, date),
    enabled: !!organizationId && !!date,
  });
};

// ==================== Notification Hooks ====================

export const useLeaveNotifications = (
  employeeId: number,
  page?: number,
  size?: number
) => {
  return useQuery({
    queryKey: leaveKeys.employeeNotifications(employeeId, page, size),
    queryFn: () => leaveService.getNotifications(employeeId, page, size),
    enabled: !!employeeId,
  });
};

export const useUnreadNotifications = (employeeId: number) => {
  return useQuery({
    queryKey: leaveKeys.unreadNotifications(employeeId),
    queryFn: () => leaveService.getUnreadNotifications(employeeId),
    enabled: !!employeeId,
  });
};

export const useUnreadNotificationsCount = (employeeId: number) => {
  return useQuery({
    queryKey: leaveKeys.unreadCount(employeeId),
    queryFn: () => leaveService.getUnreadCount(employeeId),
    enabled: !!employeeId,
  });
};
