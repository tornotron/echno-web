/**
 * Access Request Types
 *
 * Types for the access request ticketing system that allows users
 * to request permissions, module access, or role assignments.
 */

// ==================== Enums ====================

export enum AccessRequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum AccessRequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AccessRequestType {
  RESOURCE = 'resource', // Keycloak resource permission (e.g., project:read)
  MODULE = 'module', // Module access (e.g., FINANCE module)
  ROLE = 'role', // Role assignment (e.g., project-manager role)
}

// ==================== Interfaces ====================

export interface AccessRequestComment {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  isInternal: boolean; // Admin-only comments
}

export interface AccessRequest {
  id: string;

  // Requester Information
  requesterId: string;
  requesterName: string;
  requesterEmail: string;

  // What's being requested
  type: AccessRequestType;
  resourceName?: string; // e.g., 'project', 'finance', 'invoice'
  resourceScope?: string; // e.g., 'read', 'create', 'update', 'delete', 'manage'
  resourceId?: string; // For specific resource instance access
  moduleName?: string; // e.g., 'FINANCE', 'WORKFORCE', 'PROJECT'
  roleName?: string; // e.g., 'project-manager', 'accountant'

  // Request Details
  reason: string;
  businessJustification?: string;
  priority: AccessRequestPriority;
  requestedDuration?: 'permanent' | 'temporary';
  expiresAt?: Date; // For temporary access requests

  // Status & Workflow
  status: AccessRequestStatus;
  assignedTo?: string; // Admin assigned to review
  assignedToName?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewedAt?: Date;
  reviewerComments?: string;

  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date; // When status changed from draft to pending

  // Discussion
  comments: AccessRequestComment[];
}

// ==================== Display Helpers ====================

export function getStatusLabel(status: AccessRequestStatus): string {
  const labels: Record<AccessRequestStatus, string> = {
    [AccessRequestStatus.DRAFT]: 'Draft',
    [AccessRequestStatus.PENDING]: 'Pending Review',
    [AccessRequestStatus.UNDER_REVIEW]: 'Under Review',
    [AccessRequestStatus.APPROVED]: 'Approved',
    [AccessRequestStatus.REJECTED]: 'Rejected',
    [AccessRequestStatus.CANCELLED]: 'Cancelled',
    [AccessRequestStatus.EXPIRED]: 'Expired',
  };
  return labels[status] || status;
}

export function getStatusColor(status: AccessRequestStatus): string {
  const colors: Record<AccessRequestStatus, string> = {
    [AccessRequestStatus.DRAFT]:
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    [AccessRequestStatus.PENDING]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [AccessRequestStatus.UNDER_REVIEW]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AccessRequestStatus.APPROVED]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AccessRequestStatus.REJECTED]:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [AccessRequestStatus.CANCELLED]:
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    [AccessRequestStatus.EXPIRED]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return colors[status] || colors[AccessRequestStatus.DRAFT];
}

export function getPriorityLabel(priority: AccessRequestPriority): string {
  const labels: Record<AccessRequestPriority, string> = {
    [AccessRequestPriority.LOW]: 'Low',
    [AccessRequestPriority.NORMAL]: 'Normal',
    [AccessRequestPriority.HIGH]: 'High',
    [AccessRequestPriority.URGENT]: 'Urgent',
  };
  return labels[priority] || priority;
}

export function getPriorityColor(priority: AccessRequestPriority): string {
  const colors: Record<AccessRequestPriority, string> = {
    [AccessRequestPriority.LOW]:
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    [AccessRequestPriority.NORMAL]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AccessRequestPriority.HIGH]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [AccessRequestPriority.URGENT]:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[priority] || colors[AccessRequestPriority.NORMAL];
}

export function getTypeLabel(type: AccessRequestType): string {
  const labels: Record<AccessRequestType, string> = {
    [AccessRequestType.RESOURCE]: 'Resource Permission',
    [AccessRequestType.MODULE]: 'Module Access',
    [AccessRequestType.ROLE]: 'Role Assignment',
  };
  return labels[type] || type;
}

export function getRequestSummary(request: AccessRequest): string {
  switch (request.type) {
    case AccessRequestType.RESOURCE: {
      return `${request.resourceName}:${request.resourceScope}`;
    }
    case AccessRequestType.MODULE: {
      return `Module: ${request.moduleName}`;
    }
    case AccessRequestType.ROLE: {
      return `Role: ${request.roleName}`;
    }
    default: {
      return 'Unknown request type';
    }
  }
}

// ==================== Permission Helpers ====================

export function canEditRequest(
  request: AccessRequest,
  userId: string
): boolean {
  // Only requester can edit, and only in draft status
  return (
    request.requesterId === userId &&
    request.status === AccessRequestStatus.DRAFT
  );
}

export function canCancelRequest(
  request: AccessRequest,
  userId: string
): boolean {
  // Requester can cancel draft or pending requests
  return (
    request.requesterId === userId &&
    [AccessRequestStatus.DRAFT, AccessRequestStatus.PENDING].includes(
      request.status
    )
  );
}

export function canSubmitRequest(
  request: AccessRequest,
  userId: string
): boolean {
  // Only requester can submit, and only from draft status
  return (
    request.requesterId === userId &&
    request.status === AccessRequestStatus.DRAFT
  );
}

export function canReviewRequest(request: AccessRequest): boolean {
  // Can review if pending or under review
  return [
    AccessRequestStatus.PENDING,
    AccessRequestStatus.UNDER_REVIEW,
  ].includes(request.status);
}

export function isRequestActive(request: AccessRequest): boolean {
  // Request is active if not in a terminal state
  return ![
    AccessRequestStatus.APPROVED,
    AccessRequestStatus.REJECTED,
    AccessRequestStatus.CANCELLED,
    AccessRequestStatus.EXPIRED,
  ].includes(request.status);
}

// ==================== JSON Parsing ====================

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function parseComment(json: Record<string, unknown>): AccessRequestComment {
  return {
    id: String(json.id || ''),
    requestId: String(json.requestId || json.request_id || ''),
    authorId: String(json.authorId || json.author_id || ''),
    authorName: String(json.authorName || json.author_name || ''),
    content: String(json.content || ''),
    createdAt: parseDate(json.createdAt || json.created_at) || new Date(),
    isInternal: Boolean(json.isInternal || json.is_internal),
  };
}

export function parseAccessRequest(
  json: Record<string, unknown>
): AccessRequest {
  const comments = Array.isArray(json.comments)
    ? json.comments.map((c: Record<string, unknown>) => parseComment(c))
    : [];

  return {
    id: String(json.id || ''),

    // Requester
    requesterId: String(json.requesterId || json.requester_id || ''),
    requesterName: String(json.requesterName || json.requester_name || ''),
    requesterEmail: String(json.requesterEmail || json.requester_email || ''),

    // Request Type
    type: (json.type as AccessRequestType) || AccessRequestType.RESOURCE,
    resourceName: json.resourceName
      ? String(json.resourceName || json.resource_name)
      : undefined,
    resourceScope: json.resourceScope
      ? String(json.resourceScope || json.resource_scope)
      : undefined,
    resourceId: json.resourceId
      ? String(json.resourceId || json.resource_id)
      : undefined,
    moduleName: json.moduleName
      ? String(json.moduleName || json.module_name)
      : undefined,
    roleName: json.roleName
      ? String(json.roleName || json.role_name)
      : undefined,

    // Details
    reason: String(json.reason || ''),
    businessJustification: json.businessJustification
      ? String(json.businessJustification || json.business_justification)
      : undefined,
    priority:
      (json.priority as AccessRequestPriority) || AccessRequestPriority.NORMAL,
    requestedDuration: json.requestedDuration as
      | 'permanent'
      | 'temporary'
      | undefined,
    expiresAt: parseDate(json.expiresAt || json.expires_at),

    // Status
    status: (json.status as AccessRequestStatus) || AccessRequestStatus.DRAFT,
    assignedTo: json.assignedTo
      ? String(json.assignedTo || json.assigned_to)
      : undefined,
    assignedToName: json.assignedToName
      ? String(json.assignedToName || json.assigned_to_name)
      : undefined,
    reviewedBy: json.reviewedBy
      ? String(json.reviewedBy || json.reviewed_by)
      : undefined,
    reviewerName: json.reviewerName
      ? String(json.reviewerName || json.reviewer_name)
      : undefined,
    reviewedAt: parseDate(json.reviewedAt || json.reviewed_at),
    reviewerComments: json.reviewerComments
      ? String(json.reviewerComments || json.reviewer_comments)
      : undefined,

    // Audit
    createdAt: parseDate(json.createdAt || json.created_at) || new Date(),
    updatedAt: parseDate(json.updatedAt || json.updated_at) || new Date(),
    submittedAt: parseDate(json.submittedAt || json.submitted_at),

    // Comments
    comments,
  };
}

export function accessRequestToJson(
  request: AccessRequest
): Record<string, unknown> {
  return {
    id: request.id,
    requester_id: request.requesterId,
    requester_name: request.requesterName,
    requester_email: request.requesterEmail,
    type: request.type,
    resource_name: request.resourceName,
    resource_scope: request.resourceScope,
    resource_id: request.resourceId,
    module_name: request.moduleName,
    role_name: request.roleName,
    reason: request.reason,
    business_justification: request.businessJustification,
    priority: request.priority,
    requested_duration: request.requestedDuration,
    expires_at: request.expiresAt?.toISOString(),
    status: request.status,
    assigned_to: request.assignedTo,
    assigned_to_name: request.assignedToName,
    reviewed_by: request.reviewedBy,
    reviewer_name: request.reviewerName,
    reviewed_at: request.reviewedAt?.toISOString(),
    reviewer_comments: request.reviewerComments,
    created_at: request.createdAt.toISOString(),
    updated_at: request.updatedAt.toISOString(),
    submitted_at: request.submittedAt?.toISOString(),
    comments: request.comments.map((c) => ({
      id: c.id,
      request_id: c.requestId,
      author_id: c.authorId,
      author_name: c.authorName,
      content: c.content,
      created_at: c.createdAt.toISOString(),
      is_internal: c.isInternal,
    })),
  };
}

// ==================== Create Request Helpers ====================

export interface CreateAccessRequestInput {
  type: AccessRequestType;
  resourceName?: string;
  resourceScope?: string;
  resourceId?: string;
  moduleName?: string;
  roleName?: string;
  reason: string;
  businessJustification?: string;
  priority?: AccessRequestPriority;
  requestedDuration?: 'permanent' | 'temporary';
  expiresAt?: Date;
}

export function validateCreateInput(
  input: CreateAccessRequestInput
): string | null {
  if (!input.reason || input.reason.trim().length < 10) {
    return 'Please provide a reason (at least 10 characters)';
  }

  switch (input.type) {
    case AccessRequestType.RESOURCE: {
      if (!input.resourceName) {
        return 'Resource name is required for resource permission requests';
      }
      if (!input.resourceScope) {
        return 'Resource scope is required for resource permission requests';
      }
      break;
    }
    case AccessRequestType.MODULE: {
      if (!input.moduleName) {
        return 'Module name is required for module access requests';
      }
      break;
    }
    case AccessRequestType.ROLE: {
      if (!input.roleName) {
        return 'Role name is required for role assignment requests';
      }
      break;
    }
    default: {
      return 'Invalid request type';
    }
  }

  if (input.requestedDuration === 'temporary' && !input.expiresAt) {
    return 'Expiry date is required for temporary access requests';
  }

  return null;
}
