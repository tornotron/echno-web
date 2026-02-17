'use client';

/**
 * Module Management Admin Component
 *
 * Example component demonstrating how to manage organization modules
 * Shows enabled/disabled status, purchase options, and trial capabilities
 *
 * USAGE:
 * ```tsx
 * import { ModuleManagement } from '@/components/admin/module-management';
 *
 * export default function AdminPage() {
 *   return <ModuleManagement organizationId="org-123" />;
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { Module, ModuleCategory, groupModulesByCategory } from '@/lib/rbac';
import type {
  ModuleDefinition,
  UserModuleEntitlement,
} from '@/types/rbac/module';
import { EntitlementStatus } from '@/types/rbac/module';
import {
  getEntitlementSummary,
  enableModule,
  disableModule,
  purchaseModule,
  startTrial,
} from '@/lib/rbac/entitlement-service';

interface ModuleManagementProps {
  organizationId: string;
  canManage?: boolean; // Whether user can enable/disable modules
}

export function ModuleManagement({
  organizationId,
  canManage = true,
}: ModuleManagementProps) {
  const [grouped, setGrouped] = useState<
    Record<ModuleCategory, ModuleDefinition[]>
  >({} as Record<ModuleCategory, ModuleDefinition[]>);
  const [entitlements, setEntitlements] = useState<
    Record<Module, UserModuleEntitlement | null>
  >({} as Record<Module, UserModuleEntitlement | null>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!mounted) return;
      setLoading(true);

      // Load module definitions grouped by category
      const moduleGroups = groupModulesByCategory();

      // Load entitlement summary
      const summary = await getEntitlementSummary(organizationId);

      if (mounted) {
        setGrouped(moduleGroups);
        setEntitlements(summary.byModule);
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [organizationId]);

  async function reloadData() {
    setLoading(true);
    const moduleGroups = groupModulesByCategory();
    const summary = await getEntitlementSummary(organizationId);
    setGrouped(moduleGroups);
    setEntitlements(summary.byModule);
    setLoading(false);
  }

  async function handleEnableToggle(module: Module, currentlyEnabled: boolean) {
    if (!canManage) return;

    try {
      await (currentlyEnabled
        ? disableModule(organizationId, module)
        : enableModule(organizationId, module));
      await reloadData(); // Reload
    } catch (error) {
      console.error('Failed to toggle module', error);
      alert('Failed to update module');
    }
  }

  async function handlePurchase(module: Module) {
    if (!canManage) return;

    try {
      await purchaseModule(organizationId, module);
      await reloadData();
      alert(`${module} module purchased successfully!`);
    } catch (error) {
      console.error('Failed to purchase module', error);
      alert('Failed to purchase module');
    }
  }

  async function handleStartTrial(module: Module) {
    if (!canManage) return;

    try {
      await startTrial(organizationId, module, 14);
      await reloadData();
      alert(`14-day trial started for ${module} module`);
    } catch (error) {
      console.error('Failed to start trial', error);
      alert('Failed to start trial');
    }
  }

  if (loading) {
    return <div>Loading modules...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Module Management</h2>
        <p className="mt-2 text-gray-600">
          Manage feature modules for your organization
        </p>
      </div>

      {Object.entries(grouped).map(([category, modules]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-xl font-semibold capitalize">
            {category.replace('_', ' ')} Modules
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const entitlement = entitlements[module.key];
              const isEnabled = entitlement?.isEnabled || false;
              const isPurchased = entitlement?.isPurchased || false;
              const isTrial =
                entitlement?.status === EntitlementStatus.TRIAL || false;
              const isExpired =
                entitlement?.status === EntitlementStatus.EXPIRED || false;

              return (
                <div
                  key={module.key}
                  className="space-y-3 rounded-lg border p-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{module.name}</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        {module.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      {isEnabled ? (
                        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
                          Disabled
                        </span>
                      )}

                      {isTrial && (
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          Trial
                        </span>
                      )}

                      {isExpired && (
                        <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Info */}
                  {module.isPurchasable && (
                    <div className="text-sm">
                      {isPurchased ? (
                        <span className="text-green-600">✓ Purchased</span>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-semibold">
                            ${module.price?.amount}/
                            {module.price?.billingPeriod}
                          </p>
                          {!isTrial && (
                            <button
                              onClick={() => handleStartTrial(module.key)}
                              disabled={!canManage}
                              className="text-blue-600 hover:underline disabled:opacity-50"
                            >
                              Start 14-day trial
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {module.isFreeFeature && (
                    <p className="text-sm text-gray-600">Free feature</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Enable/Disable Toggle */}
                    {entitlement && (
                      <button
                        onClick={() =>
                          handleEnableToggle(module.key, isEnabled)
                        }
                        disabled={!canManage}
                        className={`rounded px-4 py-2 text-sm font-medium ${
                          isEnabled
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    )}

                    {/* Purchase Button */}
                    {module.isPurchasable && !isPurchased && (
                      <button
                        onClick={() => handlePurchase(module.key)}
                        disabled={!canManage}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Purchase
                      </button>
                    )}

                    {/* Not Entitled */}
                    {!entitlement && (
                      <button
                        onClick={() => enableModule(organizationId, module.key)}
                        disabled={!canManage}
                        className="rounded bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                      >
                        Enable
                      </button>
                    )}
                  </div>

                  {/* Expiry Info */}
                  {entitlement?.expiresAt && (
                    <p className="text-xs text-gray-500">
                      Expires:{' '}
                      {new Date(entitlement.expiresAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* Dependencies */}
                  {module.dependencies && module.dependencies.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Requires: {module.dependencies.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact Module Status Badge Component
 * Shows quick status of a module in smaller UI contexts
 */
export function ModuleStatusBadge({
  entitlement,
}: {
  module: Module;
  entitlement: UserModuleEntitlement | null;
}) {
  if (!entitlement) {
    return (
      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
        Not Available
      </span>
    );
  }

  if (!entitlement.isEnabled) {
    return (
      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
        Disabled
      </span>
    );
  }

  if (entitlement.status === EntitlementStatus.EXPIRED) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-600">
        Expired
      </span>
    );
  }

  if (entitlement.status === EntitlementStatus.TRIAL) {
    return (
      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600">
        Trial
      </span>
    );
  }

  if (entitlement.isPurchased) {
    return (
      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-600">
        Active
      </span>
    );
  }

  return (
    <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-600">
      Enabled
    </span>
  );
}
