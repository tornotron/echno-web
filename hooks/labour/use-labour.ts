import { useQuery } from '@tanstack/react-query';
import { labourService } from '@/services/labour-service';
import { labourKeys } from './labour-keys';

export const useLabour = () =>
  useQuery({
    queryKey: labourKeys.lists(),
    queryFn: () => labourService.getAll(),
  });

export const useLabourById = (id: number) =>
  useQuery({
    queryKey: labourKeys.detail(id),
    queryFn: () => labourService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
