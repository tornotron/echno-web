export const employeeKeys = {
  all: ['employees'] as const,
  detail: (id: number) => ['employees', id] as const,
  subordinates: (managerId?: number) =>
    ['employees', 'subordinates', managerId] as const,
  managers: () => ['employees', 'managers'] as const,
};
