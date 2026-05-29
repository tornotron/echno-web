export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  detail: (id: number) => [...inspectionKeys.all, 'detail', id] as const,
};
