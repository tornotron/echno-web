import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ncrService, type NcrListParams } from '@/services/ncr-service';
import type {
  AssignNcrRequest,
  CreateNcrRequest,
  NcrRemarksRequest,
} from '@/types/inspection/ncr';
import { ncrKeys } from './ncr-keys';

/** Fetches NCRs for the current organization, optionally filtered. */
export const useNcrs = (params?: NcrListParams) =>
  useQuery({
    queryKey: params ? ncrKeys.list(params) : ncrKeys.lists(),
    queryFn: () => ncrService.getAll(params),
  });

/**
 * The NCRs raised against one inspection. Stays disabled until the id
 * resolves, so it is safe to call before the route param arrives.
 */
export const useNcrsByInspection = (inspectionId?: string) => {
  const params: NcrListParams = { inspectionId };
  return useQuery({
    queryKey: ncrKeys.list(params),
    queryFn: () => ncrService.getAll(params),
    enabled: !!inspectionId,
  });
};

/** Fetches a single NCR by id. */
export const useNcrById = (id: string) =>
  useQuery({
    queryKey: ncrKeys.detail(id),
    queryFn: () => ncrService.getById(id),
    enabled: !!id,
  });

/**
 * Invalidates both the lists and the one detail a lifecycle step touched.
 *
 * Every transition changes the row's status, so a stale list would keep
 * offering an action the backend has already moved past.
 */
function useNcrInvalidation() {
  const queryClient = useQueryClient();
  return (id: string) => {
    queryClient.invalidateQueries({ queryKey: ncrKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ncrKeys.detail(id) });
  };
}

export const useCreateNcr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateNcrRequest) => ncrService.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ncrKeys.lists() });
    },
  });
};

export const useAssignNcr = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: AssignNcrRequest }) =>
      ncrService.assign(id, req),
    onSuccess: (data) => invalidate(data.id),
  });
};

export const useCompleteCorrectiveAction = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: NcrRemarksRequest }) =>
      ncrService.completeCorrectiveAction(id, req),
    onSuccess: (data) => invalidate(data.id),
  });
};

export const useVerifyNcr = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: NcrRemarksRequest }) =>
      ncrService.verify(id, req),
    onSuccess: (data) => invalidate(data.id),
  });
};

export const useRejectNcr = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: NcrRemarksRequest }) =>
      ncrService.reject(id, req),
    onSuccess: (data) => invalidate(data.id),
  });
};

export const useReopenNcr = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: NcrRemarksRequest }) =>
      ncrService.reopen(id, req),
    onSuccess: (data) => invalidate(data.id),
  });
};

export const useCloseNcr = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: (id: string) => ncrService.close(id),
    onSuccess: (data) => invalidate(data.id),
  });
};
