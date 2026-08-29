import { useQuery } from '@tanstack/react-query';
import {
  inspectionService,
  type InspectionListParams,
} from '@/services/inspection-service';
import { InspectionType } from '@/types/inspection';
import { inspectionKeys } from './inspection-keys';

/**
 * Fetches inspections for the current organization, optionally filtered.
 *
 * The list endpoint accepts `projectId`, `status`, `type`, `category`, `trade`
 * and `result`, so a caller that wants a subset should pass it here rather
 * than fetch everything and narrow in the browser: narrowing client-side only
 * ever sees the rows already in hand.
 */
export const useInspections = (params?: InspectionListParams) =>
  useQuery({
    queryKey: params ? inspectionKeys.list(params) : inspectionKeys.lists(),
    queryFn: () => inspectionService.getAll(params),
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

/**
 * Fetches a single inspection by id. Stays disabled until `id` is a non-empty
 * string, so it is safe to call before the route param resolves.
 */
export const useInspectionById = (id: string) =>
  useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => inspectionService.getById(id),
    enabled: !!id,
  });
