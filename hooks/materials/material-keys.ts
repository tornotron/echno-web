export const materialsKeys = {
  all: ['materials'] as const,
  lists: () => [...materialsKeys.all, 'list'] as const,
  detail: (id: number) => [...materialsKeys.all, 'detail', id] as const,
  stock: (id: number) => [...materialsKeys.all, 'stock', id] as const,
  search: (name: string) => [...materialsKeys.all, 'search', name] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...materialsKeys.all, 'paginated', { pageNo, pageSize }] as const,
};
