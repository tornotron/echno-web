import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Employee,
  parseEmployee,
  employeeToJson,
} from '@/types/employee/employee';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse employee data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseEmployee(data: ApiResponse): Employee {
  try {
    return parseEmployee(data);
  } catch (error) {
    logger.error('Failed to parse employee data:', error);
    throw new ApiError(
      'Failed to process employee data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse employee array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseEmployees(data: ApiResponse[]): Employee[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseEmployee(item));
  } catch (error) {
    logger.error('Failed to parse employees data:', error);
    throw new ApiError(
      'Failed to process employees data. Please try again.',
      422
    );
  }
}

/**
 * employeeService
 *
 * Thin wrapper around the backend employee REST endpoints. Provides
 * typed, parse-safe convenience methods for common employee CRUD
 * operations used throughout the application.
 */
export const employeeService = {
  /**
   * Fetch all employees.
   *
   * @returns {Promise<Employee[]>} Resolves with an array of parsed employees.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getAll(): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>('/employee/web');
    return safeParseEmployees(data);
  },

  /**
   * Fetch a single employee by id.
   *
   * @param {number} id - Employee id.
   * @returns {Promise<Employee>} Parsed employee object.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getById(id: number): Promise<Employee> {
    const data = await api.get<ApiResponse>(`/employee/web/${id}`);
    return safeParseEmployee(data);
  },

  /**
   * Fetch employees by organization id.
   *
   * @param {number} organizationId - Organization id.
   * @returns {Promise<Employee[]>} Resolves with an array of parsed employees.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getByOrganization(organizationId: number): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>(
      `/employee/web/organization/${organizationId}`
    );
    return safeParseEmployees(data);
  },

  /**
   * Create a new employee.
   *
   * @param {Partial<Employee>} employee - Employee data to create.
   * @returns {Promise<Employee>} The created, parsed employee.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async create(employee: Partial<Employee>): Promise<Employee> {
    const payload = employeeToJson(employee as Employee);
    const data = await api.post<ApiResponse>('/employee/web', payload);
    return safeParseEmployee(data);
  },

  /**
   * Update an existing employee.
   *
   * @param {number} id - Employee id to update.
   * @param {Partial<Employee>} employee - Employee data to persist.
   * @returns {Promise<Employee>} The updated, parsed employee.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async update(id: number, employee: Partial<Employee>): Promise<Employee> {
    const payload = employeeToJson(employee as Employee);
    const data = await api.patch<ApiResponse>(`/employee/web/${id}`, payload);
    return safeParseEmployee(data);
  },

  /**
   * Delete an employee by id.
   *
   * @param {number} id - Employee id to delete.
   * @returns {Promise<void>} Resolves when delete completes.
   * @throws {ApiError} on network or server errors
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/employee/web/${id}`);
  },

  /**
   * Join a user to an organization as an employee.
   *
   * @param {number} userId - User id to join.
   * @param {number} organizationId - Organization id to join.
   * @returns {Promise<Employee>} The created employee record.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async joinOrganization(
    userId: number,
    organizationId: number
  ): Promise<Employee> {
    const data = await api.post<ApiResponse>(
      `/employee/web/joinOrganization/${userId}/${organizationId}`,
      {}
    );
    return safeParseEmployee(data);
  },

  /**
   * Assign a reporting manager to an employee.
   *
   * @param {number} employeeId - Employee id (employee.id, not employeeId field).
   * @param {number} managerId - Manager's employee id.
   * @returns {Promise<Employee>} The updated employee with manager assigned.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async assignManager(
    employeeId: number,
    managerId: number
  ): Promise<Employee> {
    const data = await api.put<ApiResponse>(
      `/employee/web/employeeId/${employeeId}/managerId/${managerId}`,
      {}
    );
    return safeParseEmployee(data);
  },

  /**
   * Remove the assigned manager from an employee.
   *
   * @param {number} employeeId - Employee id (employee.id, not employeeId field).
   * @returns {Promise<Employee>} The updated employee with manager removed.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async removeManager(employeeId: number): Promise<Employee> {
    const data = await api.delete<ApiResponse>(
      `/employee/web/employeeId/${employeeId}/manager`
    );
    return safeParseEmployee(data);
  },

  /**
   * Get all subordinates (direct reports) of a manager.
   *
   * @param {number} managerId - Manager's employee id.
   * @returns {Promise<Employee[]>} Array of employees reporting to this manager.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getSubordinates(managerId: number): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>(
      `/employee/web/managerId/${managerId}/subordinates`
    );
    return safeParseEmployees(data);
  },

  /**
   * Get all managers in an organization.
   *
   * @param {number} organizationId - Organization id.
   * @returns {Promise<Employee[]>} Array of employees who are managers.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getManagers(organizationId: number): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>(
      `/employee/web/managers/organizationId/${organizationId}`
    );
    return safeParseEmployees(data);
  },
};
