export const accessControlKeys = {
  all: ['access-control'] as const,
  roles: () => [...accessControlKeys.all, 'roles'] as const,
  groups: () => [...accessControlKeys.all, 'groups'] as const,
  users: () => [...accessControlKeys.all, 'users'] as const,
};
