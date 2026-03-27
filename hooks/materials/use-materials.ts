/**
 * hooks/materials/use-materials.ts
 *
 * React Query hooks for fetching materials and material consumptions.
 */

import { useQuery } from '@tanstack/react-query';
import { materialsService } from '@/services/materials-service';
import { ConsumptionType } from '@/types/materials';
import { materialsKeys } from './material-keys';

export const useMaterials = () =>
  useQuery({
    queryKey: materialsKeys.lists(),
    queryFn: () => materialsService.getAll(),
  });

export const useMaterialsPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: materialsKeys.paginated(pageNo, pageSize),
    queryFn: () => materialsService.getAllPaginated(pageNo, pageSize),
  });

export const useMaterialSearch = (name: string) =>
  useQuery({
    queryKey: materialsKeys.search(name),
    queryFn: () => materialsService.search(name),
    enabled: name.length > 0,
  });

export const useMaterial = (id: number) =>
  useQuery({
    queryKey: materialsKeys.detail(id),
    queryFn: () => materialsService.getById(id),
    enabled: !!id,
  });

export const useMaterialWithStock = (id: number) =>
  useQuery({
    queryKey: materialsKeys.stock(id),
    queryFn: () => materialsService.getWithStock(id),
    enabled: !!id,
  });

export const useMaterialConsumptions = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: materialsKeys.consumptionsPaginated(pageNo, pageSize),
    queryFn: () => materialsService.getConsumptionsPaginated(pageNo, pageSize),
  });

export const useMaterialConsumption = (id: number) =>
  useQuery({
    queryKey: materialsKeys.consumptionDetail(id),
    queryFn: () => materialsService.getConsumptionById(id),
    enabled: !!id,
  });

export const useConsumptionsByMaterial = (materialId: number) =>
  useQuery({
    queryKey: materialsKeys.consumptionsByMaterial(materialId),
    queryFn: () => materialsService.getConsumptionsByMaterial(materialId),
    enabled: !!materialId,
  });

export const useConsumptionsByType = (type: ConsumptionType) =>
  useQuery({
    queryKey: materialsKeys.consumptionsByType(type),
    queryFn: () => materialsService.getConsumptionsByType(type),
    enabled: !!type,
  });

export const useConsumptionsByDateRange = (
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: materialsKeys.consumptionsByDateRange(startDate, endDate),
    queryFn: () =>
      materialsService.getConsumptionsByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

export { materialsKeys } from './material-keys';
