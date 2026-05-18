export const stockAdjustmentKeys = {
  all: ['stock-adjustments'] as const,
  lists: () => [...stockAdjustmentKeys.all, 'list'] as const,
  detail: (id: number) => [...stockAdjustmentKeys.all, 'detail', id] as const,
};
