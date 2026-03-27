/**
 * hooks/indents/indent-keys.ts
 *
 * React Query key factory for indents and indent items.
 */

export const indentsKeys = {
  all: ['indents'] as const,
  lists: () => [...indentsKeys.all, 'list'] as const,
  detail: (id: number) => [...indentsKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...indentsKeys.all, 'paginated', { pageNo, pageSize }] as const,

  items: () => [...indentsKeys.all, 'items'] as const,
  itemDetail: (id: number) => [...indentsKeys.items(), 'detail', id] as const,
  itemsByIndent: (indentId: number) =>
    [...indentsKeys.items(), 'indent', indentId] as const,
  itemsByMaterial: (materialId: number) =>
    [...indentsKeys.items(), 'material', materialId] as const,
  itemsByConversionStatus: (converted: boolean) =>
    [...indentsKeys.items(), 'converted', converted] as const,
};
