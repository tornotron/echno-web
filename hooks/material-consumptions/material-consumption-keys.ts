import { ConsumptionType } from '@/types/materials';

export const materialConsumptionsKeys = {
  all: ['material-consumptions'] as const,
  lists: () => [...materialConsumptionsKeys.all, 'list'] as const,
  detail: (id: number) =>
    [...materialConsumptionsKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [
      ...materialConsumptionsKeys.all,
      'paginated',
      { pageNo, pageSize },
    ] as const,
  byMaterial: (materialId: number) =>
    [...materialConsumptionsKeys.all, 'material', materialId] as const,
  byType: (type: ConsumptionType) =>
    [...materialConsumptionsKeys.all, 'type', type] as const,
  byTask: (taskId: number) =>
    [...materialConsumptionsKeys.all, 'task', taskId] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [
      ...materialConsumptionsKeys.all,
      'date-range',
      startDate,
      endDate,
    ] as const,
};
