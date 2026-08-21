import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspection-service';
import { InspectionType } from '@/types/inspection';
import { inspectionKeys } from './inspection-keys';

export const useInspections = () =>
  useQuery({
    queryKey: inspectionKeys.lists(),
    queryFn: () => inspectionService.getAll(),
  });

// Compliance-type inspections for a single project, used by the project
// compliance tab. Only enabled once a project id is available.
export const useComplianceInspectionsByProject = (projectId?: number) => {
  const params = { projectId, type: InspectionType.COMPLIANCE };
  return useQuery({
    queryKey: inspectionKeys.list(params),
    queryFn: () => inspectionService.getAll(params),
    enabled: projectId !== undefined,
  });
};

export const useInspectionById = (id: string) =>
  useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => inspectionService.getById(id),
    enabled: !!id,
  });
