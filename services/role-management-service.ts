import { api } from '@/lib/api/api-client';
import { OrgRole } from '@/types/employee/org-role';

/**
 * roleManagementService
 *
 * Thin wrapper around the Keycloak group role assignment endpoints.
 * Provides typed convenience methods for assigning and unassigning
 * organization roles to employees via the backend.
 */
export const roleManagementService = {
  /**
   * Assign an organization role to an employee.
   *
   * @param {number} employeeId - The employee's numeric id.
   * @param {OrgRole} orgRole - The role to assign.
   * @returns {Promise<void>} Resolves when the role has been assigned.
   * @throws {ApiError} on network or server errors
   */
  async assignRole(employeeId: number, orgRole: OrgRole): Promise<void> {
    await api.post(
      '/keycloakGroup/web/assignRole',
      {},
      { employeeId, orgRole }
    );
  },

  /**
   * Unassign an organization role from an employee.
   *
   * @param {number} employeeId - The employee's numeric id.
   * @param {OrgRole} orgRole - The role to remove.
   * @returns {Promise<void>} Resolves when the role has been removed.
   * @throws {ApiError} on network or server errors
   */
  async unassignRole(employeeId: number, orgRole: OrgRole): Promise<void> {
    await api.post(
      '/keycloakGroup/web/unassignRole',
      {},
      { employeeId, orgRole }
    );
  },
};
