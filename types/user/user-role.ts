// types/user/user-role.ts
export enum UserRole {
  OWNER = 'OWNER',
  CO_FOUNDER = 'CO_FOUNDER',
  HR_MANAGER = 'HR_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  STUDENT = 'STUDENT',
  MANAGEMENT = 'MANAGEMENT',
  ADMINISTRATOR = 'ADMINISTRATOR',
}

const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.OWNER]: 'Owner',
  [UserRole.CO_FOUNDER]: 'Co-Founder',
  [UserRole.HR_MANAGER]: 'HR Manager',
  [UserRole.EMPLOYEE]: 'Employee',
  [UserRole.STUDENT]: 'Student',
  [UserRole.MANAGEMENT]: 'Management',
  [UserRole.ADMINISTRATOR]: 'Administrator',
};

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role] ?? role;
}

export function userRoleFromString(str: string): UserRole | undefined {
  const values = Object.values(UserRole) as string[];
  return values.includes(str) ? (str as UserRole) : undefined;
}
