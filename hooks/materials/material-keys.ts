import { ConsumptionType } from '@/types/materials';

export const materialsKeys = {
  all: ['materials'] as const,
  lists: () => [...materialsKeys.all, 'list'] as const,
  detail: (id: number) => [...materialsKeys.all, 'detail', id] as const,
  stock: (id: number) => [...materialsKeys.all, 'stock', id] as const,
  search: (name: string) => [...materialsKeys.all, 'search', name] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...materialsKeys.all, 'paginated', { pageNo, pageSize }] as const,

  consumptions: () => [...materialsKeys.all, 'consumptions'] as const,
  consumptionDetail: (id: number) =>
    [...materialsKeys.consumptions(), 'detail', id] as const,
  consumptionsByMaterial: (materialId: number) =>
    [...materialsKeys.consumptions(), 'material', materialId] as const,
  consumptionsByType: (type: ConsumptionType) =>
    [...materialsKeys.consumptions(), 'type', type] as const,
  consumptionsByDateRange: (startDate: string, endDate: string) =>
    [
      ...materialsKeys.consumptions(),
      'date-range',
      startDate,
      endDate,
    ] as const,
  consumptionsPaginated: (pageNo: number, pageSize: number) =>
    [
      ...materialsKeys.consumptions(),
      'paginated',
      { pageNo, pageSize },
    ] as const,
};
