import { useQuery } from '@tanstack/react-query';
import { wbsElementService } from '@/services/wbs-element-service';
import { wbsElementKeys } from './wbs-element-keys';

export const useWbsElements = (projectId: number) =>
  useQuery({
    queryKey: wbsElementKeys.byProject(projectId),
    queryFn: () => wbsElementService.getAll(projectId),
    enabled: !!projectId,
  });

export const useWbsTree = (projectId: number) =>
  useQuery({
    queryKey: wbsElementKeys.tree(projectId),
    queryFn: () => wbsElementService.getTree(projectId),
    enabled: !!projectId,
  });

export const useWbsLeaves = (projectId: number) =>
  useQuery({
    queryKey: wbsElementKeys.leaves(projectId),
    queryFn: () => wbsElementService.getLeaves(projectId),
    enabled: !!projectId,
  });

export const useWbsElement = (projectId: number, elementId: number) =>
  useQuery({
    queryKey: wbsElementKeys.detail(projectId, elementId),
    queryFn: () => wbsElementService.getById(projectId, elementId),
    enabled: !!projectId && !!elementId,
  });
