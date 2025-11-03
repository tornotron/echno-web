// types/employee/employee-status.ts
export enum EmployeeStatus {
  active = 'active',
  inactive = 'inactive',
  onLeave = 'onLeave',
  terminated = 'terminated',
  resigned = 'resigned',
  probation = 'probation',
  suspended = 'suspended',
}

export function getEmployeeStatusLabel(status: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    [EmployeeStatus.active]: 'Active',
    [EmployeeStatus.inactive]: 'Inactive',
    [EmployeeStatus.onLeave]: 'On Leave',
    [EmployeeStatus.terminated]: 'Terminated',
    [EmployeeStatus.resigned]: 'Resigned',
    [EmployeeStatus.probation]: 'Probation',
    [EmployeeStatus.suspended]: 'Suspended',
  };
  return map[status];
}

export function getEmployeeStatusColor(status: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    [EmployeeStatus.active]: '#4CAF50',
    [EmployeeStatus.inactive]: '#9E9E9E',
    [EmployeeStatus.onLeave]: '#FF9800',
    [EmployeeStatus.terminated]: '#F44336',
    [EmployeeStatus.resigned]: '#E91E63',
    [EmployeeStatus.probation]: '#2196F3',
    [EmployeeStatus.suspended]: '#795548',
  };
  return map[status];
}

export function employeeStatusFromString(str: string): EmployeeStatus {
  const status = (EmployeeStatus as any)[str];
  if (!status) return EmployeeStatus.active;
  return status;
}