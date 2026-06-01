/**
 * hooks/indents/indent-keys.ts
 *
 * React Query key factory for indents.
 *
 * Indent items have their own active namespace in `hooks/indent-items/`.
 * Do not re-introduce `items*` shapes here.
 */

export const indentsKeys = {
  all: ['indents'] as const,
  lists: () => [...indentsKeys.all, 'list'] as const,
  detail: (id: number) => [...indentsKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...indentsKeys.all, 'paginated', { pageNo, pageSize }] as const,
};
