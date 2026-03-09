export const organizationKeys = {
  all: ['organizations'] as const,
  detail: (id: number) => ['organizations', id] as const,
};
