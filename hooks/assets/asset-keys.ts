export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  detail: (id: number) => [...assetKeys.all, 'detail', id] as const,
};
