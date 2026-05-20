export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  detail: (id: number) => [...expenseKeys.all, 'detail', id] as const,
};
