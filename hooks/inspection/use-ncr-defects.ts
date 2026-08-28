import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ncrDefectService } from '@/services/ncr-defect-service';
import { toast } from '@/lib/styles/toast-styles';
import type {
  CreateNcrCommentRequest,
  CreateNcrDefectRequest,
  UpdateNcrDefectRequest,
} from '@/types/inspection';
import { inspectionKeys, ncrDefectKeys } from './keys';

export function useNcrDefects() {
  return useQuery({
    queryKey: ncrDefectKeys.lists(),
    queryFn: () => ncrDefectService.getAll(),
  });
}

export function useProjectNcrDefects(projectId: number | undefined) {
  return useQuery({
    queryKey: ncrDefectKeys.byProject(projectId ?? 0),
    queryFn: () => ncrDefectService.getByProject(projectId as number),
    enabled: Boolean(projectId),
  });
}

export function useInspectionNcrDefects(inspectionId: number | undefined) {
  return useQuery({
    queryKey: ncrDefectKeys.byInspection(inspectionId ?? 0),
    queryFn: () => ncrDefectService.getByInspection(inspectionId as number),
    enabled: Boolean(inspectionId),
  });
}

export function useNcrDefect(id: number | undefined) {
  return useQuery({
    queryKey: ncrDefectKeys.detail(id ?? 0),
    queryFn: () => ncrDefectService.getById(id as number),
    enabled: Boolean(id),
  });
}

export function useCreateNcrDefect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateNcrDefectRequest) => ncrDefectService.create(dto),
    onSuccess: (defect) => {
      queryClient.setQueryData(ncrDefectKeys.detail(defect.id), defect);
      queryClient.invalidateQueries({ queryKey: ncrDefectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ncrDefectKeys.byProject(defect.projectId),
      });

      // An NCR raised from a checklist item changes its inspection's open count.
      if (defect.inspectionId) {
        queryClient.invalidateQueries({
          queryKey: ncrDefectKeys.byInspection(defect.inspectionId),
        });
        queryClient.invalidateQueries({
          queryKey: inspectionKeys.detail(defect.inspectionId),
        });
      }
      toast.success('NCR raised');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateNcrDefect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateNcrDefectRequest }) =>
      ncrDefectService.update(id, dto),
    onSuccess: (defect) => {
      queryClient.setQueryData(ncrDefectKeys.detail(defect.id), defect);
      queryClient.invalidateQueries({ queryKey: ncrDefectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ncrDefectKeys.byProject(defect.projectId),
      });
      if (defect.inspectionId) {
        queryClient.invalidateQueries({
          queryKey: ncrDefectKeys.byInspection(defect.inspectionId),
        });
        queryClient.invalidateQueries({
          queryKey: inspectionKeys.detail(defect.inspectionId),
        });
      }
      toast.success('NCR updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useNcrComments(id: number | undefined) {
  return useQuery({
    queryKey: ncrDefectKeys.comments(id ?? 0),
    queryFn: () => ncrDefectService.getComments(id as number),
    enabled: Boolean(id),
  });
}

/**
 * Posts a timeline entry, optionally advancing the NCR in the same call.
 * A transition changes the defect itself, so its detail and lists are
 * invalidated too — a plain comment only touches the timeline.
 */
export function useAddNcrComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateNcrCommentRequest }) =>
      ncrDefectService.addComment(id, dto),
    onSuccess: (comment, { dto }) => {
      queryClient.invalidateQueries({
        queryKey: ncrDefectKeys.comments(comment.ncrId),
      });

      if (dto.toStatus) {
        queryClient.invalidateQueries({
          queryKey: ncrDefectKeys.detail(comment.ncrId),
        });
        queryClient.invalidateQueries({ queryKey: ncrDefectKeys.lists() });
        toast.success('NCR updated');
      } else {
        toast.success('Comment Added');
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddNcrEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) =>
      ncrDefectService.addEvidence(id, files),
    onSuccess: (defect) => {
      queryClient.setQueryData(ncrDefectKeys.detail(defect.id), defect);
      queryClient.invalidateQueries({ queryKey: ncrDefectKeys.lists() });
      toast.success('Evidence added');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
