export const indentItemKeys = {
  all: ['indent-items'] as const,
  lists: () => [...indentItemKeys.all, 'list'] as const,
  detail: (id: number) => [...indentItemKeys.all, 'detail', id] as const,
  byIndent: (indentId: number) =>
    [...indentItemKeys.all, 'indent', indentId] as const,
};
