/**
 * Leave Request Status Enumeration
 */
export enum LeaveStatus {
  draft = "draft",
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
  cancelled = "cancelled",
  withdrawn = "withdrawn",
}

/**
 * Get display label for leave status
 */
export function getLeaveStatusLabel(status: LeaveStatus): string {
  const labels: Record<LeaveStatus, string> = {
    [LeaveStatus.draft]: "Draft",
    [LeaveStatus.pending]: "Pending Approval",
    [LeaveStatus.approved]: "Approved",
    [LeaveStatus.rejected]: "Rejected",
    [LeaveStatus.cancelled]: "Cancelled",
    [LeaveStatus.withdrawn]: "Withdrawn",
  }
  return labels[status]
}

/**
 * Get color class for leave status badge
 */
export function getLeaveStatusColor(status: LeaveStatus): string {
  const colors: Record<LeaveStatus, string> = {
    [LeaveStatus.draft]: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    [LeaveStatus.pending]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    [LeaveStatus.approved]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    [LeaveStatus.rejected]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    [LeaveStatus.cancelled]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    [LeaveStatus.withdrawn]: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
  }
  return colors[status]
}
