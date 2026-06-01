/**
 * hooks/user/user-keys.ts
 *
 * React Query key factory for user-centric queries.
 *
 * Convention note: `all` is used as BOTH the invalidation prefix AND the
 * singleton key for the current authenticated user (`useUser()`). There is
 * only one current user at a time, so a singleton key shape is appropriate
 * and matches existing call sites in `UserPrefetcher`, `profile-edit-form`,
 * and cross-module invalidations from `useUpdateEmployee*`.
 *
 * `lists()` / `detail(id)` shapes are reserved for the future readAllUsers
 * and per-id user-fetch endpoints (currently unimplemented locally).
 */

export const userKeys = {
  all: ['user'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  employees: () => [...userKeys.all, 'employees'] as const,
  organizationsForUser: (userId: number) =>
    [...userKeys.all, userId, 'organizations'] as const,
};
