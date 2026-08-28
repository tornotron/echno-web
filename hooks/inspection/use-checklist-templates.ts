import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checklistTemplateService,
  type ChecklistTemplateListParams,
} from '@/services/checklist-template-service';
import type {
  ChecklistTemplateRequest,
  InspectionTrade,
} from '@/types/inspection/checklist-template';

export const checklistTemplateKeys = {
  all: ['checklist-templates'] as const,
  lists: () => [...checklistTemplateKeys.all, 'list'] as const,
  list: (params: ChecklistTemplateListParams) =>
    [...checklistTemplateKeys.lists(), params] as const,
  detail: (id: string) =>
    [...checklistTemplateKeys.all, 'detail', id] as const,
  starters: () => [...checklistTemplateKeys.all, 'starters'] as const,
};

/** Fetches the organization's checklist templates, optionally filtered. */
export const useChecklistTemplates = (
  params?: ChecklistTemplateListParams
) =>
  useQuery({
    queryKey: params
      ? checklistTemplateKeys.list(params)
      : checklistTemplateKeys.lists(),
    queryFn: () => checklistTemplateService.getAll(params),
  });

/** Fetches a single template by id. */
export const useChecklistTemplateById = (id: string) =>
  useQuery({
    queryKey: checklistTemplateKeys.detail(id),
    queryFn: () => checklistTemplateService.getById(id),
    enabled: !!id,
  });

/**
 * The product-supplied starter templates.
 *
 * They never change within a session, so this is cached hard: refetching it on
 * every mount would spend a request on a fixed list.
 */
export const useStarterChecklistTemplates = () =>
  useQuery({
    queryKey: checklistTemplateKeys.starters(),
    queryFn: () => checklistTemplateService.getStarters(),
    staleTime: Infinity,
  });

export const useCreateChecklistTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ChecklistTemplateRequest) =>
      checklistTemplateService.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.lists(),
      });
    },
  });
};

export const useUpdateChecklistTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ChecklistTemplateRequest }) =>
      checklistTemplateService.update(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.detail(data.id),
      });
    },
  });
};

/** Copies a starter template into the organization as an editable one. */
export const useAdoptStarterTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trade: InspectionTrade) =>
      checklistTemplateService.adoptStarter(trade),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.lists(),
      });
    },
  });
};
