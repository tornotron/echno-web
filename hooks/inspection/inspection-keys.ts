export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  detail: (id: string) => [...inspectionKeys.all, 'detail', id] as const,
};
