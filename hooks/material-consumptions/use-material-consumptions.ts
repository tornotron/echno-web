import { useQuery } from '@tanstack/react-query';
import { materialConsumptionsService } from '@/services/material-consumptions-service';
import { ConsumptionType } from '@/types/materials';
import { materialConsumptionsKeys } from './material-consumption-keys';

export const useAllMaterialConsumptions = () =>
  useQuery({
    queryKey: materialConsumptionsKeys.lists(),
    queryFn: () => materialConsumptionsService.getAll(),
  });

export const useMaterialConsumptionsPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: materialConsumptionsKeys.paginated(pageNo, pageSize),
    queryFn: () =>
      materialConsumptionsService.getAllPaginated(pageNo, pageSize),
  });

export const useMaterialConsumption = (id: number) =>
  useQuery({
    queryKey: materialConsumptionsKeys.detail(id),
    queryFn: () => materialConsumptionsService.getById(id),
    enabled: !!id,
  });

export const useConsumptionsByMaterial = (materialId: number) =>
  useQuery({
    queryKey: materialConsumptionsKeys.byMaterial(materialId),
    queryFn: () => materialConsumptionsService.getByMaterial(materialId),
    enabled: !!materialId,
  });

export const useConsumptionsByType = (type: ConsumptionType) =>
  useQuery({
    queryKey: materialConsumptionsKeys.byType(type),
    queryFn: () => materialConsumptionsService.getByType(type),
    enabled: !!type,
  });

export const useConsumptionsByTask = (taskId: number) =>
  useQuery({
    queryKey: materialConsumptionsKeys.byTask(taskId),
    queryFn: () => materialConsumptionsService.getByTask(taskId),
    enabled: taskId > 0,
  });

export const useConsumptionsByDateRange = (
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: materialConsumptionsKeys.byDateRange(startDate, endDate),
    queryFn: () =>
      materialConsumptionsService.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
