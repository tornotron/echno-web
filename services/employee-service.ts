import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { Employee, parseEmployee } from '@/types/employee/employee';
import {
  CreateEmployeeRequest,
  createEmployeeToJson,
} from '@/types/employee/employee-create';
import {
  UpdateEmployeeRequest,
  updateEmployeeToJson,
} from '@/types/employee/employee-update';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

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

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>('/employee/web');
    return safeParseEmployees(data);
  },

  async getById(id: number): Promise<Employee> {
    const data = await api.get<ApiResponse>(`/employee/web/${id}`);
    return safeParseEmployee(data);
  },

  async create(dto: CreateEmployeeRequest): Promise<Employee> {
    const payload = createEmployeeToJson(dto);
    const data = await api.post<ApiResponse>('/employee/web', payload);
    return safeParseEmployee(data);
  },

  async update(id: number, dto: UpdateEmployeeRequest): Promise<Employee> {
    const payload = updateEmployeeToJson(dto);
    const data = await api.patch<ApiResponse>(`/employee/web/${id}`, payload);
    return safeParseEmployee(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/employee/web/${id}`);
  },

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

  async removeManager(employeeId: number): Promise<Employee> {
    const data = await api.delete<ApiResponse>(
      `/employee/web/employeeId/${employeeId}/manager`
    );
    return safeParseEmployee(data);
  },

  async getSubordinates(managerId: number): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>(
      `/employee/web/managerId/${managerId}/subordinates`
    );
    return safeParseEmployees(data);
  },

  async getManagers(): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>(`/employee/web/managers`);
    return safeParseEmployees(data);
  },
};
