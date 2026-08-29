import type { NcrListParams } from '@tornotron/echno-core/ncr/services';

export const ncrKeys = {
  all: ['ncrs'] as const,
  lists: () => [...ncrKeys.all, 'list'] as const,
  // Filtered list variant. It nests under `lists()`, so invalidating the
  // `lists()` prefix (as the mutation hooks do) also invalidates every
  // filtered list.
  list: (params: NcrListParams) => [...ncrKeys.lists(), params] as const,
  detail: (id: string) => [...ncrKeys.all, 'detail', id] as const,
};
