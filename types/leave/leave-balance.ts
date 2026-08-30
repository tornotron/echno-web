/**
 * types/leave/leave-balance.ts
 *
 * Domain model for Leave Balance management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parsePositiveInt } from '@/types/parse-id';
import { TransactionType } from './leave-enums';

/**
 * Leave Balance interface
 */
export interface LeaveBalance {
  id: number;
  employeeId: number;
  leavePolicyId: number;
  leaveTypeName?: string;
  /**
   * Days the policy grants for a full year.
   *
   * The entitlement the balance is measured against, and a different figure from
   * `openingBalance`, which is only what last year carried over. Read from the
   * policy the backend embeds in the balance.
   */
  annualQuota: number;
  year: number;
  openingBalance: number;
  accrued: number;
  used: number;
  pending: number;
  carryForwardFromPrevious: number;
  availableBalance: number;
  bookableBalance: number;
  lastAccrualDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Leave Balance Summary interface
 */
export interface LeaveBalanceSummary {
  employeeId: number;
  year: number;
  balances: LeaveBalance[];
  totalAvailable: number;
  totalUsed: number;
  totalPending: number;
}

/**
 * Leave Transaction interface
 */
export interface LeaveTransaction {
  id: number;
  leaveBalanceId: number;
  leaveTypeName?: string;
  transactionType: TransactionType;
  days: number;
  balanceBefore: number;
  balanceAfter: number;
  leaveRequestId?: number;
  reason?: string;
  transactionDate: Date;
  createdById?: number;
  createdAt?: Date;
}

export interface AdjustLeaveBalanceRequest {
  employeeId: number;
  leavePolicyId: number;
  days: number;
  reason: string;
  adjustedById: number;
}

/**
 * Parse leave balance from JSON
 */
export function parseLeaveBalance(json: any): LeaveBalance {
  return {
    id: parsePositiveInt(json.id, 'parseLeaveBalance.id'),
    employeeId: parsePositiveInt(
      json.employeeId,
      'parseLeaveBalance.employeeId'
    ),
    leavePolicyId: parsePositiveInt(
      json.leavePolicyId ?? json.leavePolicy?.id,
      'parseLeaveBalance.leavePolicyId'
    ),
    leaveTypeName: json.leaveTypeName ?? json.leavePolicy?.leaveTypeName,
    annualQuota: json.annualQuota ?? json.leavePolicy?.annualQuota ?? 0,
    year: json.year ?? new Date().getFullYear(),
    openingBalance: json.openingBalance ?? 0,
    accrued: json.accrued ?? 0,
    used: json.used ?? 0,
    pending: json.pending ?? 0,
    carryForwardFromPrevious: json.carryForwardFromPrevious ?? 0,
    availableBalance: json.availableBalance ?? json.available ?? 0,
    bookableBalance: json.bookableBalance ?? json.bookable ?? 0,
    lastAccrualDate:
      (json.lastAccrualDate ?? json.lastCalculatedAt)
        ? new Date(json.lastAccrualDate ?? json.lastCalculatedAt)
        : undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
  };
}

/**
 * Parse leave balance summary from JSON
 */
export function parseLeaveBalanceSummary(json: any): LeaveBalanceSummary {
  return {
    employeeId: parsePositiveInt(
      json.employeeId,
      'parseLeaveBalanceSummary.employeeId'
    ),
    year: json.year ?? new Date().getFullYear(),
    balances: json.balances
      ? json.balances.map((b: any) => parseLeaveBalance(b))
      : [],
    totalAvailable: json.totalAvailable ?? 0,
    totalUsed: json.totalUsed ?? 0,
    totalPending: json.totalPending ?? 0,
  };
}

/**
 * Parse leave transaction from JSON
 */
export function parseLeaveTransaction(json: any): LeaveTransaction {
  return {
    id: parsePositiveInt(json.id, 'parseLeaveTransaction.id'),
    leaveBalanceId: parsePositiveInt(
      json.leaveBalanceId,
      'parseLeaveTransaction.leaveBalanceId'
    ),
    leaveTypeName: json.leaveTypeName ?? json.leaveBalance?.leaveTypeName,
    transactionType: json.transactionType ?? TransactionType.ADJUSTMENT,
    days: json.days ?? 0,
    balanceBefore: json.balanceBefore ?? 0,
    balanceAfter: json.balanceAfter ?? 0,
    leaveRequestId: json.leaveRequestId,
    reason: json.reason,
    transactionDate: json.transactionDate
      ? new Date(json.transactionDate)
      : new Date(),
    createdById: json.createdById,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
  };
}
