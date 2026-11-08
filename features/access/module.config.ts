import type { ModuleConfig } from '@/lib/modules/module-config';

/**
 * The permission strings the backend's `access` module declares
 * (`AccessControlModule.PERMISSIONS`) and guards its endpoints with:
 * `@access.can('access', 'read')` on every read of the Roles & Permissions
 * screen, `@access.can('access', 'edit')` on every write. Changing the
 * baseline role everyone holds is its own permission.
 */
export const ACCESS_PERMISSIONS = {
  read: 'access:read',
  edit: 'access:edit',
  editEmployeeRole: 'access:edit-employee-role',
} as const;

/**
 * The access module's registry contract. A core module: the backend
 * manifest has no entitlement key, so every organization has it, and it
 * contributes no sidebar entry. The screen is a tab on the organization
 * page, shown to a holder of {@link ACCESS_PERMISSIONS.read}.
 */
export const accessModule: ModuleConfig = {
  id: 'access',
  entitlementFeatureKey: '',
  nav: [],
};
