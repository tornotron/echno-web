import { useQuery } from '@tanstack/react-query';
import { materialsService } from '@/services/materials-service';
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

export { materialsKeys } from './material-keys';
