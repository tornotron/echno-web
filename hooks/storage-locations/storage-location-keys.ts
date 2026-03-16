export const storageLocationKeys = {
  all: ['storage-locations'] as const,
  lists: () => [...storageLocationKeys.all, 'list'] as const,
};
