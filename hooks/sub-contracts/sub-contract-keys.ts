export const subContractKeys = {
  all: ['sub-contracts'] as const,
  lists: () => [...subContractKeys.all, 'list'] as const,
  detail: (id: number) => [...subContractKeys.all, 'detail', id] as const,
};
