export const userKeys = {
  all: ['user'] as const,
  employees: () => ['user', 'employees'] as const,
};
