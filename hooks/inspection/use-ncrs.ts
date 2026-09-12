import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ncrService,
  type NcrListParams,
} from '@tornotron/echno-core/ncr/services';
import type {
  AssignNcrRequest,
  CreateNcrRequest,
  NcrRemarksRequest,
  VerifyNcrRequest,
} from '@tornotron/echno-core/inspection/types';
import {
  inspectionEventKeys,
  reinspectionKeys,
} from '@tornotron/echno-core/inspection/hooks';
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
 * Invalidates the lists, the one detail a lifecycle step touched, and the
 * event log it wrote to.
 *
 * Every transition changes the row's status, so a stale list would keep
 * offering an action the backend has already moved past. Every transition
 * also records an event, so the History tab is stale after any of them, and
 * a verification that names a reinspection changes what that attempt is
 * evidence for.
 */
function useNcrInvalidation() {
  const queryClient = useQueryClient();
  return (id: string) => {
    queryClient.invalidateQueries({ queryKey: ncrKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ncrKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: inspectionEventKeys.all });
    queryClient.invalidateQueries({ queryKey: reinspectionKeys.byNcr(id) });
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

/**
 * Accepts the corrective work. `req.reinspectionId` names the passed
 * reinspection the acceptance rests on; the backend answers 400 when it is
 * another NCR's or has not passed, so the dialog only offers passed attempts.
 */
export const useVerifyNcr = () => {
  const invalidate = useNcrInvalidation();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: VerifyNcrRequest }) =>
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
