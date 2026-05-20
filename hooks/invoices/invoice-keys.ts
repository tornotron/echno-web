export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  detail: (id: number) => [...invoiceKeys.all, 'detail', id] as const,
};
