/**
 * Mock data for user-specific permission grants
 * Demonstrates various scenarios for the permission grant system
 */

import {
  UserPermissionGrant,
  GrantStatus,
  PermissionScope,
} from '@/types/rbac/user-permission';
import { Permission } from '@/types/rbac/permission';
import { Module } from '@/types/rbac/module';

/**
 * Mock permission grants showing various scenarios
 */
export const mockUserPermissionGrants: UserPermissionGrant[] = [
  // Example 1: Active grant with expiration for temporary project access
  {
    id: 'grant-001',
    userId: '1', // First user in system
    permission: Permission.PROJECT_MANAGE,
    module: Module.PROJECT,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-11-01'),
    expiresAt: new Date('2025-03-31'), // Expires in 3 months
    grantedBy: '1', // Admin user
    reason: 'Temporary project management access for Q1 2025 initiatives',
    scope: {
      projectIds: ['proj-001', 'proj-002'],
    },
    metadata: {
      approvalTicket: 'TICKET-12345',
      projectNames: ['Website Redesign', 'Mobile App Launch'],
    },
  },

  // Example 2: Active permanent grant for organization-specific access
  {
    id: 'grant-002',
    userId: '1', // Same user - multiple grants example
    permission: Permission.REPORT_VIEW,
    module: Module.ANALYTICS,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-10-15'),
    expiresAt: null, // Permanent grant
    grantedBy: '1',
    reason: 'Cross-department analytics access for strategic planning',
    scope: {
      organizationIds: ['org-001'],
    },
  },

  // Example 3: Active grant for specific resource access
  {
    id: 'grant-003',
    userId: '2', // Second user
    permission: Permission.INVENTORY_MANAGE,
    module: Module.INVENTORY,
    resourceId: 'inventory-warehouse-A',
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-12-01'),
    expiresAt: new Date('2025-06-30'),
    grantedBy: '1',
    reason: 'Warehouse A inventory management during peak season',
    scope: {
      resourceIds: ['warehouse-A-equipment', 'warehouse-A-supplies'],
    },
  },

  // Example 4: Suspended grant (temporarily disabled)
  {
    id: 'grant-004',
    userId: '3',
    permission: Permission.EMPLOYEE_UPDATE,
    module: Module.EMPLOYEE,
    status: GrantStatus.SUSPENDED,
    grantedAt: new Date('2024-09-01'),
    expiresAt: new Date('2025-12-31'),
    grantedBy: '1',
    reason: 'HR administrative access for compensation review',
    metadata: {
      suspendedAt: new Date('2024-12-15'),
      suspendedBy: '1',
      suspensionReason: 'Under review pending policy compliance audit',
    },
  },

  // Example 5: Expired grant
  {
    id: 'grant-005',
    userId: '1', // Example of expired grant for first user
    permission: Permission.FINANCE_APPROVE,
    module: Module.FINANCE,
    status: GrantStatus.ACTIVE, // Status is active but expiresAt is in the past
    grantedAt: new Date('2024-06-01'),
    expiresAt: new Date('2024-11-30'), // Already expired
    grantedBy: '1',
    reason: 'Temporary payment approval authority during CFO absence',
    scope: {
      conditions: {
        maxAmount: 5000,
        requiresSecondaryApproval: true,
      },
    },
  },

  // Example 6: Revoked grant
  {
    id: 'grant-006',
    userId: '2',
    permission: Permission.PROJECT_DELETE,
    module: Module.PROJECT,
    status: GrantStatus.REVOKED,
    grantedAt: new Date('2024-08-01'),
    expiresAt: null,
    grantedBy: '1',
    reason: 'Data cleanup permissions for migration project',
    metadata: {
      revokedAt: new Date('2024-10-15'),
      revokedBy: '1',
      revocationReason: 'Migration project completed',
    },
  },

  // Example 7: Multiple scope constraints
  {
    id: 'grant-007',
    userId: '2',
    permission: Permission.USER_CREATE,
    module: Module.USER,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-11-15'),
    expiresAt: new Date('2025-02-28'),
    grantedBy: '1',
    reason: 'Onboarding coordinator for new department launch',
    scope: {
      organizationIds: ['org-002'],
      projectIds: ['proj-003'],
      conditions: {
        maxUsersPerDay: 10,
        requiresManagerApproval: true,
        allowedRoles: ['employee', 'contractor'],
      },
    },
  },

  // Example 8: Active grant for attendance management
  {
    id: 'grant-008',
    userId: '3',
    permission: Permission.ATTENDANCE_MANAGE,
    module: Module.ATTENDANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-12-10'),
    expiresAt: new Date('2025-05-31'),
    grantedBy: '1',
    reason: 'Shift supervisor role for manufacturing floor',
    scope: {
      resourceIds: ['floor-1', 'floor-2'],
      conditions: {
        shiftTypes: ['morning', 'afternoon'],
        departmentId: 'manufacturing',
      },
    },
  },

  // Example 9: Finance view access with strict conditions
  {
    id: 'grant-009',
    userId: '4',
    permission: Permission.FINANCE_VIEW,
    module: Module.FINANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-11-20'),
    expiresAt: null,
    grantedBy: '1',
    reason: 'Payroll coordinator for specific departments',
    scope: {
      organizationIds: ['org-001'],
      conditions: {
        departments: ['sales', 'marketing'],
        excludeSensitiveData: true,
        auditLogRequired: true,
      },
    },
  },

  // Example 10: Inspection approval access
  {
    id: 'grant-010',
    userId: '5',
    permission: Permission.INSPECTION_APPROVE,
    module: Module.INSPECTION,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-12-01'),
    expiresAt: new Date('2025-04-30'),
    grantedBy: '1',
    reason: 'Q1 2025 safety inspection coordinator',
    scope: {
      projectIds: ['proj-safety-2025', 'proj-compliance-2025'],
      conditions: {
        maxInspections: 50,
        allowedTypes: ['safety', 'compliance', 'quality'],
      },
    },
    metadata: {
      budget: 15_000,
      quarterlyReviewRequired: true,
    },
  },

  // Example 11: Attendance view access for team leads
  {
    id: 'grant-011',
    userId: '2',
    permission: Permission.ATTENDANCE_VIEW,
    module: Module.ATTENDANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-12-20'),
    expiresAt: null, // Permanent grant
    grantedBy: '1',
    reason: 'Team lead can view their team attendance',
    scope: {
      conditions: {
        teamIds: ['team-alpha', 'team-beta'],
        ownTeamOnly: true,
      },
    },
  },

  // Example 12: Attendance view all for HR managers
  {
    id: 'grant-012',
    userId: '1',
    permission: Permission.ATTENDANCE_VIEW_ALL,
    module: Module.ATTENDANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-11-01'),
    expiresAt: null,
    grantedBy: '1',
    reason: 'HR manager with organization-wide attendance visibility',
    scope: {
      organizationIds: ['org-001'],
    },
    metadata: {
      role: 'hr-manager',
      department: 'human-resources',
    },
  },

  // Example 13: Attendance manage for shift supervisors
  {
    id: 'grant-013',
    userId: '4',
    permission: Permission.ATTENDANCE_MANAGE,
    module: Module.ATTENDANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-12-15'),
    expiresAt: new Date('2025-06-30'),
    grantedBy: '1',
    reason: 'Shift supervisor can manage attendance for production floor',
    scope: {
      resourceIds: ['production-floor-1', 'production-floor-2'],
      conditions: {
        shiftTypes: ['day', 'night'],
        canApproveOvertime: true,
        canMarkAbsences: true,
        departmentId: 'production',
      },
    },
    metadata: {
      maxOvertimeHoursPerWeek: 20,
      requiresApprovalAbove: 10,
    },
  },

  // Example 14: Limited attendance view for employees (own records only)
  {
    id: 'grant-014',
    userId: '5',
    permission: Permission.ATTENDANCE_VIEW,
    module: Module.ATTENDANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-10-01'),
    expiresAt: null,
    grantedBy: '1',
    reason: 'All employees can view their own attendance records',
    scope: {
      conditions: {
        ownRecordsOnly: true,
      },
    },
  },

  // Example 15: Temporary attendance management during vacation
  {
    id: 'grant-015',
    userId: '6',
    permission: Permission.ATTENDANCE_MANAGE,
    module: Module.ATTENDANCE,
    status: GrantStatus.ACTIVE,
    grantedAt: new Date('2024-12-20'),
    expiresAt: new Date('2025-01-10'),
    grantedBy: '1',
    reason:
      'Temporary attendance management while primary supervisor is on vacation',
    scope: {
      resourceIds: ['warehouse-b'],
      conditions: {
        substituteFor: 'user-3',
        departments: ['warehouse', 'logistics'],
      },
    },
    metadata: {
      substituteRole: 'shift-supervisor',
      emergencyContact: 'user-1',
    },
  },
];

/**
 * Get permission grants for a specific user
 */
export function getUserPermissionGrants(userId: string): UserPermissionGrant[] {
  return mockUserPermissionGrants.filter((grant) => grant.userId === userId);
}

/**
 * Get active permission grants for a specific user
 */
export function getActiveUserPermissionGrants(
  userId: string
): UserPermissionGrant[] {
  return mockUserPermissionGrants.filter(
    (grant) =>
      grant.userId === userId &&
      grant.status === GrantStatus.ACTIVE &&
      (!grant.expiresAt || grant.expiresAt > new Date())
  );
}

/**
 * Get permission grants by status
 */
export function getPermissionGrantsByStatus(
  status: GrantStatus
): UserPermissionGrant[] {
  return mockUserPermissionGrants.filter((grant) => grant.status === status);
}

/**
 * Get expiring grants (expiring within the next 30 days)
 */
export function getExpiringGrants(): UserPermissionGrant[] {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return mockUserPermissionGrants.filter(
    (grant) =>
      grant.status === GrantStatus.ACTIVE &&
      grant.expiresAt &&
      grant.expiresAt > new Date() &&
      grant.expiresAt <= thirtyDaysFromNow
  );
}

/**
 * Get grants for a specific permission
 */
export function getGrantsForPermission(
  permission: Permission
): UserPermissionGrant[] {
  return mockUserPermissionGrants.filter(
    (grant) => grant.permission === permission
  );
}

/**
 * Get grants for a specific module
 */
export function getGrantsForModule(module: Module): UserPermissionGrant[] {
  return mockUserPermissionGrants.filter((grant) => grant.module === module);
}

/**
 * Count grants by status
 */
export function countGrantsByStatus(): Record<GrantStatus, number> {
  return {
    [GrantStatus.ACTIVE]: getPermissionGrantsByStatus(GrantStatus.ACTIVE)
      .length,
    [GrantStatus.SUSPENDED]: getPermissionGrantsByStatus(GrantStatus.SUSPENDED)
      .length,
    [GrantStatus.EXPIRED]: getPermissionGrantsByStatus(GrantStatus.EXPIRED)
      .length,
    [GrantStatus.REVOKED]: getPermissionGrantsByStatus(GrantStatus.REVOKED)
      .length,
  };
}
