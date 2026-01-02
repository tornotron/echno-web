import { Module, EntitlementStatus } from '@/types/rbac/module';
import type { UserModuleEntitlement } from '@/types/rbac/module';

/**
 * Mock Module Entitlements
 *
 * Demonstrates different entitlement scenarios:
 * - Free modules (always enabled)
 * - Purchased modules
 * - Trial modules
 * - Expired modules
 * - Disabled modules
 */

// Organization 1 - Full access (all modules purchased and enabled)
export const mockOrg1Entitlements: UserModuleEntitlement[] = [
  {
    id: 'ent-org1-task',
    organizationId: '1',
    module: Module.TASK,
    isEnabled: true,
    isPurchased: false,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-01-01'),
    license: { type: 'free' },
  },
  {
    id: 'ent-org1-project',
    organizationId: '1',
    module: Module.PROJECT,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-01-01'),
    license: { type: 'paid', seats: 50 },
  },
  {
    id: 'ent-org1-finance',
    organizationId: '1',
    module: Module.FINANCE,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-02-01'),
    license: { type: 'paid', seats: 20 },
  },
  {
    id: 'ent-org1-workforce',
    organizationId: '1',
    module: Module.WORKFORCE,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-01-01'),
    license: { type: 'paid', seats: 100 },
  },
  {
    id: 'ent-org1-inventory',
    organizationId: '1',
    module: Module.INVENTORY,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-03-01'),
    license: { type: 'paid', seats: 30 },
  },
  {
    id: 'ent-org1-vendor',
    organizationId: '1',
    module: Module.VENDOR,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-01-15'),
    license: { type: 'paid', seats: 10 },
  },
  {
    id: 'ent-org1-attendance',
    organizationId: '1',
    module: Module.ATTENDANCE,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-01-01'),
    license: { type: 'paid', seats: 100 },
  },
];

// Organization 2 - Limited access (some modules on trial, some not purchased)
export const mockOrg2Entitlements: UserModuleEntitlement[] = [
  {
    id: 'ent-org2-task',
    organizationId: '2',
    module: Module.TASK,
    isEnabled: true,
    isPurchased: false,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-06-01'),
    license: { type: 'free' },
  },
  {
    id: 'ent-org2-project',
    organizationId: '2',
    module: Module.PROJECT,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-06-01'),
    license: { type: 'paid', seats: 10 },
  },
  {
    id: 'ent-org2-finance',
    organizationId: '2',
    module: Module.FINANCE,
    isEnabled: true,
    isPurchased: false,
    status: EntitlementStatus.TRIAL,
    grantedAt: new Date('2025-01-01'),
    expiresAt: new Date('2025-01-15'),
    license: { type: 'trial' },
  },
  {
    id: 'ent-org2-workforce',
    organizationId: '2',
    module: Module.WORKFORCE,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2023-06-01'),
    license: { type: 'paid', seats: 25 },
  },
  // Inventory - not purchased, disabled
  {
    id: 'ent-org2-inventory',
    organizationId: '2',
    module: Module.INVENTORY,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2023-06-01'),
  },
  // Vendor - not purchased, disabled
  {
    id: 'ent-org2-vendor',
    organizationId: '2',
    module: Module.VENDOR,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2023-06-01'),
  },
  // Attendance - on trial
  {
    id: 'ent-org2-attendance',
    organizationId: '2',
    module: Module.ATTENDANCE,
    isEnabled: true,
    isPurchased: false,
    status: EntitlementStatus.TRIAL,
    grantedAt: new Date('2025-01-01'),
    expiresAt: new Date('2025-02-01'),
    license: { type: 'trial', seats: 25 },
  },
];

// Organization 3 - Minimal access (only free and basic modules)
export const mockOrg3Entitlements: UserModuleEntitlement[] = [
  {
    id: 'ent-org3-task',
    organizationId: '3',
    module: Module.TASK,
    isEnabled: true,
    isPurchased: false,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2024-01-01'),
    license: { type: 'free' },
  },
  {
    id: 'ent-org3-project',
    organizationId: '3',
    module: Module.PROJECT,
    isEnabled: true,
    isPurchased: true,
    status: EntitlementStatus.ACTIVE,
    grantedAt: new Date('2024-01-01'),
    license: { type: 'paid', seats: 5 },
  },
  // All other modules disabled/not purchased
  {
    id: 'ent-org3-finance',
    organizationId: '3',
    module: Module.FINANCE,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2024-01-01'),
  },
  {
    id: 'ent-org3-workforce',
    organizationId: '3',
    module: Module.WORKFORCE,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2024-01-01'),
  },
  {
    id: 'ent-org3-inventory',
    organizationId: '3',
    module: Module.INVENTORY,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2024-01-01'),
  },
  {
    id: 'ent-org3-vendor',
    organizationId: '3',
    module: Module.VENDOR,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2024-01-01'),
  },
  {
    id: 'ent-org3-attendance',
    organizationId: '3',
    module: Module.ATTENDANCE,
    isEnabled: false,
    isPurchased: false,
    status: EntitlementStatus.SUSPENDED,
    grantedAt: new Date('2024-01-01'),
  },
];

// All mock entitlements combined
export const mockModuleEntitlements: UserModuleEntitlement[] = [
  ...mockOrg1Entitlements,
  ...mockOrg2Entitlements,
  ...mockOrg3Entitlements,
];

/**
 * Helper function to get entitlements for a specific organization
 */
export function getEntitlementsForOrganization(
  organizationId: string
): UserModuleEntitlement[] {
  return mockModuleEntitlements.filter(
    (ent) => ent.organizationId === organizationId
  );
}

/**
 * Helper function to check if an organization has access to a module
 */
export function hasModuleAccess(
  organizationId: string,
  module: Module
): boolean {
  const entitlement = mockModuleEntitlements.find(
    (ent) => ent.organizationId === organizationId && ent.module === module
  );

  if (!entitlement) return false;
  if (!entitlement.isEnabled) return false;

  // Free license features are always accessible
  if (entitlement.license?.type === 'free') return true;

  // Check if purchased
  if (!entitlement.isPurchased) return false;

  // Check if expired
  if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
    return false;
  }

  return true;
}
