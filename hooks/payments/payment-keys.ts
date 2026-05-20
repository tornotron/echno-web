export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  detail: (id: number) => [...paymentKeys.all, 'detail', id] as const,
};
