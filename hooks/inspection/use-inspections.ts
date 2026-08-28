import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspection-service';
import { inspectionKeys } from './keys';

export function useInspections() {
  return useQuery({
    queryKey: inspectionKeys.lists(),
    queryFn: () => inspectionService.getAll(),
  });
}

export function useProjectInspections(projectId: number | undefined) {
  return useQuery({
    queryKey: inspectionKeys.byProject(projectId ?? 0),
    queryFn: () => inspectionService.getByProject(projectId as number),
    enabled: Boolean(projectId),
  });
}

export function useInspection(id: number | undefined) {
  return useQuery({
    queryKey: inspectionKeys.detail(id ?? 0),
    queryFn: () => inspectionService.getById(id as number),
    enabled: Boolean(id),
  });
}

/**
 * The checklist definition pinned to an inspection.
 * Immutable, so it never needs refetching once loaded.
 */
export function useInspectionChecklist(id: number | undefined) {
  return useQuery({
    queryKey: inspectionKeys.checklist(id ?? 0),
    queryFn: () => inspectionService.getChecklist(id as number),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useInspectionSubmission(id: number | undefined) {
  return useQuery({
    queryKey: inspectionKeys.submission(id ?? 0),
    queryFn: () => inspectionService.getSubmission(id as number),
    enabled: Boolean(id),
  });
}
