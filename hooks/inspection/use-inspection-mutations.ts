import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspection-service';
import { toast } from '@/lib/styles/toast-styles';
import {
  type CreateInspectionRequest,
  type SaveInspectionSubmissionRequest,
  type UpdateInspectionRequest,
  SubmissionStatus,
} from '@/types/inspection';
import { inspectionKeys } from './keys';

export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInspectionRequest) => inspectionService.create(dto),
    onSuccess: (inspection) => {
      queryClient.setQueryData(
        inspectionKeys.detail(inspection.id),
        inspection
      );
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.byProject(inspection.projectId),
      });
      toast.success('Inspection created');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateInspectionRequest }) =>
      inspectionService.update(id, dto),
    onSuccess: (inspection) => {
      queryClient.setQueryData(
        inspectionKeys.detail(inspection.id),
        inspection
      );
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.byProject(inspection.projectId),
      });
      toast.success('Inspection updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * Saves a draft or final submission.
 *
 * A submit also changes the parent inspection's status and compliance figure
 * server-side, so the detail and list keys are invalidated too — a draft save
 * only touches the submission itself.
 */
export function useSaveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: SaveInspectionSubmissionRequest;
    }) => inspectionService.saveSubmission(id, dto),
    onSuccess: (submission, { dto }) => {
      queryClient.setQueryData(
        inspectionKeys.submission(submission.inspectionId),
        submission
      );

      if (dto.status === SubmissionStatus.submitted) {
        queryClient.invalidateQueries({
          queryKey: inspectionKeys.detail(submission.inspectionId),
        });
        queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
        toast.success('Inspection submitted');
      } else {
        toast.success('Draft saved');
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
