export const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  detail: (id: number) => [...receiptKeys.all, 'detail', id] as const,
};
