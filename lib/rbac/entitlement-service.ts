/**
 * Entitlement Service
 *
 * Manages user and organization module entitlements
 * Handles enabling/disabling modules, trials, purchases, and expirations
 *
 * NOTE: This is an in-memory implementation for development/testing
 * In production, this should be backed by a database (e.g., PostgreSQL, MongoDB)
 */

import {
  Module,
  UserModuleEntitlement,
  EntitlementStatus,
} from '@/types/rbac/module';
import { getModuleDefinition } from './module-registry';
import { logger } from '@/lib/logger';

/**
 * In-memory entitlement store
 * Replace with database queries in production
 */
const entitlementsStore = new Map<string, UserModuleEntitlement>();

/**
 * Generate entitlement ID
 */
function generateEntitlementId(
  organizationId: string,
  module: Module,
  userId?: string
): string {
  return userId
    ? `${organizationId}:${userId}:${module}`
    : `${organizationId}:${module}`;
}

/**
 * Create a new module entitlement
 */
export async function createEntitlement(params: {
  organizationId: string;
  module: Module;
  userId?: string;
  isPurchased?: boolean;
  grantedBy?: string;
  status?: EntitlementStatus;
  expiresAt?: Date;
  licenseType?: 'trial' | 'paid' | 'enterprise' | 'free';
}): Promise<UserModuleEntitlement> {
  const {
    organizationId,
    module,
    userId,
    isPurchased = false,
    grantedBy,
    status = EntitlementStatus.ACTIVE,
    expiresAt,
    licenseType = 'free',
  } = params;

  const moduleDefinition = getModuleDefinition(module);
  const id = generateEntitlementId(organizationId, module, userId);

  // Check if entitlement already exists
  if (entitlementsStore.has(id)) {
    throw new Error(`Entitlement already exists: ${id}`);
  }

  const entitlement: UserModuleEntitlement = {
    id,
    organizationId,
    module,
    userId,
    isEnabled: true,
    isPurchased: moduleDefinition.isFreeFeature ? true : isPurchased,
    status,
    grantedAt: new Date(),
    grantedBy,
    expiresAt,
    license: {
      type: licenseType,
    },
  };

  entitlementsStore.set(id, entitlement);

  logger.info('Module entitlement created', {
    id,
    organizationId,
    module,
    userId,
    status,
  });

  return entitlement;
}

/**
 * Get entitlement by ID
 */
export async function getEntitlement(
  id: string
): Promise<UserModuleEntitlement | null> {
  return entitlementsStore.get(id) || null;
}

/**
 * Get all entitlements for an organization
 */
export async function getOrganizationEntitlements(
  organizationId: string
): Promise<UserModuleEntitlement[]> {
  const entitlements: UserModuleEntitlement[] = [];

  for (const entitlement of entitlementsStore.values()) {
    if (entitlement.organizationId === organizationId) {
      entitlements.push(entitlement);
    }
  }

  return entitlements;
}

/**
 * Get all entitlements for a user (org-level + user-specific)
 */
export async function getUserEntitlements(
  userId: string,
  organizationId: string
): Promise<UserModuleEntitlement[]> {
  const entitlements: UserModuleEntitlement[] = [];

  for (const entitlement of entitlementsStore.values()) {
    if (entitlement.organizationId !== organizationId) continue;

    // Include org-level entitlements and user-specific entitlements
    if (!entitlement.userId || entitlement.userId === userId) {
      entitlements.push(entitlement);
    }
  }

  return entitlements;
}

/**
 * Enable a module for an organization/user
 */
export async function enableModule(
  organizationId: string,
  module: Module,
  userId?: string,
  enabledBy?: string
): Promise<UserModuleEntitlement> {
  const id = generateEntitlementId(organizationId, module, userId);
  let entitlement = entitlementsStore.get(id);

  if (entitlement) {
    // Update existing entitlement
    entitlement.isEnabled = true;
    entitlementsStore.set(id, entitlement);
  } else {
    // Create new entitlement
    entitlement = await createEntitlement({
      organizationId,
      module,
      userId,
      grantedBy: enabledBy,
    });
  }

  logger.info('Module enabled', {
    organizationId,
    module,
    userId,
    enabledBy,
  });

  return entitlement;
}

/**
 * Disable a module for an organization/user
 */
export async function disableModule(
  organizationId: string,
  module: Module,
  userId?: string
): Promise<void> {
  const id = generateEntitlementId(organizationId, module, userId);
  const entitlement = entitlementsStore.get(id);

  if (!entitlement) {
    throw new Error(`Entitlement not found: ${id}`);
  }

  entitlement.isEnabled = false;
  entitlementsStore.set(id, entitlement);

  logger.info('Module disabled', {
    organizationId,
    module,
    userId,
  });
}

/**
 * Purchase a module
 */
export async function purchaseModule(
  organizationId: string,
  module: Module,
  userId?: string,
  purchasedBy?: string
): Promise<UserModuleEntitlement> {
  const id = generateEntitlementId(organizationId, module, userId);
  let entitlement = entitlementsStore.get(id);

  const moduleDefinition = getModuleDefinition(module);

  if (!moduleDefinition.isPurchasable) {
    throw new Error(`Module ${module} is not purchasable`);
  }

  if (entitlement) {
    // Update existing entitlement
    entitlement.isPurchased = true;
    entitlement.status = EntitlementStatus.ACTIVE;
    if (entitlement.license) {
      entitlement.license.type = 'paid';
    }
    entitlementsStore.set(id, entitlement);
  } else {
    // Create new entitlement with purchase
    entitlement = await createEntitlement({
      organizationId,
      module,
      userId,
      isPurchased: true,
      grantedBy: purchasedBy,
      status: EntitlementStatus.ACTIVE,
      licenseType: 'paid',
    });
  }

  logger.info('Module purchased', {
    organizationId,
    module,
    userId,
    purchasedBy,
  });

  return entitlement;
}

/**
 * Start a trial for a module
 */
export async function startTrial(
  organizationId: string,
  module: Module,
  trialDays: number = 14,
  userId?: string
): Promise<UserModuleEntitlement> {
  const id = generateEntitlementId(organizationId, module, userId);
  const existing = entitlementsStore.get(id);

  if (existing && existing.license?.type === 'trial') {
    throw new Error('Trial already active for this module');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + trialDays);

  const entitlement = await createEntitlement({
    organizationId,
    module,
    userId,
    isPurchased: false,
    status: EntitlementStatus.TRIAL,
    expiresAt,
    licenseType: 'trial',
  });

  logger.info('Module trial started', {
    organizationId,
    module,
    userId,
    trialDays,
    expiresAt,
  });

  return entitlement;
}

/**
 * Update entitlement status
 */
export async function updateEntitlementStatus(
  id: string,
  status: EntitlementStatus
): Promise<UserModuleEntitlement> {
  const entitlement = entitlementsStore.get(id);

  if (!entitlement) {
    throw new Error(`Entitlement not found: ${id}`);
  }

  entitlement.status = status;
  entitlementsStore.set(id, entitlement);

  logger.info('Entitlement status updated', {
    id,
    status,
  });

  return entitlement;
}

/**
 * Check for expired entitlements and update their status
 */
export async function checkExpiredEntitlements(): Promise<void> {
  const now = new Date();
  let expiredCount = 0;

  for (const entitlement of entitlementsStore.values()) {
    if (
      entitlement.expiresAt &&
      entitlement.expiresAt <= now &&
      entitlement.status !== EntitlementStatus.EXPIRED
    ) {
      entitlement.status = EntitlementStatus.EXPIRED;
      entitlement.isEnabled = false;
      entitlementsStore.set(entitlement.id, entitlement);
      expiredCount++;

      logger.warn('Module entitlement expired', {
        id: entitlement.id,
        organizationId: entitlement.organizationId,
        module: entitlement.module,
        expiresAt: entitlement.expiresAt,
      });
    }
  }

  if (expiredCount > 0) {
    logger.info('Expired entitlements checked', { expiredCount });
  }
}

/**
 * Delete an entitlement
 */
export async function deleteEntitlement(id: string): Promise<void> {
  if (!entitlementsStore.has(id)) {
    throw new Error(`Entitlement not found: ${id}`);
  }

  entitlementsStore.delete(id);

  logger.info('Entitlement deleted', { id });
}

/**
 * Initialize default entitlements for a new organization
 * Automatically enables all free modules
 */
export async function initializeOrganizationEntitlements(
  organizationId: string
): Promise<UserModuleEntitlement[]> {
  const freeModules: Module[] = [
    Module.TASK,
    Module.PROJECT,
    Module.ISSUE,
    Module.ORGANIZATION,
    Module.USER,
    Module.ADMIN,
  ];

  const entitlements: UserModuleEntitlement[] = [];

  for (const moduleKey of freeModules) {
    const entitlement = await createEntitlement({
      organizationId,
      module: moduleKey,
      isPurchased: true,
      licenseType: 'free',
      status: EntitlementStatus.ACTIVE,
    });

    entitlements.push(entitlement);
  }

  logger.info('Organization entitlements initialized', {
    organizationId,
    modulesEnabled: freeModules.length,
  });

  return entitlements;
}

/**
 * Get entitlement summary for an organization
 */
export async function getEntitlementSummary(organizationId: string): Promise<{
  total: number;
  enabled: number;
  purchased: number;
  trial: number;
  expired: number;
  byModule: Record<Module, UserModuleEntitlement | null>;
}> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  const summary = {
    total: entitlements.length,
    enabled: entitlements.filter((e) => e.isEnabled).length,
    purchased: entitlements.filter((e) => e.isPurchased).length,
    trial: entitlements.filter((e) => e.status === EntitlementStatus.TRIAL)
      .length,
    expired: entitlements.filter((e) => e.status === EntitlementStatus.EXPIRED)
      .length,
    byModule: {} as Record<Module, UserModuleEntitlement | null>,
  };

  // Build module map
  for (const moduleKey of Object.values(Module)) {
    const entitlement = entitlements.find((e) => e.module === moduleKey);
    summary.byModule[moduleKey] = entitlement || null;
  }

  return summary;
}

// Run expiration check every hour
if (typeof globalThis !== 'undefined') {
  setInterval(
    () => {
      void checkExpiredEntitlements();
    },
    60 * 60 * 1000
  );
}
