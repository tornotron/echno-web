import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspection-service';
import { inspectionKeys } from './inspection-keys';

export const useInspections = () =>
  useQuery({
    queryKey: inspectionKeys.lists(),
    queryFn: () => inspectionService.getAll(),
  });

export const useInspectionById = (id: string) =>
  useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => inspectionService.getById(id),
    enabled: !!id,
  });
