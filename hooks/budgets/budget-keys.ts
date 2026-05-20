export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  detail: (id: number) => [...budgetKeys.all, 'detail', id] as const,
};
