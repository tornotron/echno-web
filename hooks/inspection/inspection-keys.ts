import type { InspectionListParams } from '@/services/inspection-service';

export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  // Filtered list variant. It nests under `lists()`, so invalidating the
  // `lists()` prefix (as the mutation hooks do) also invalidates every
  // filtered list.
  list: (params: InspectionListParams) =>
    [...inspectionKeys.lists(), params] as const,
  detail: (id: string) => [...inspectionKeys.all, 'detail', id] as const,
};
