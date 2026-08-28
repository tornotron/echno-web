import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectDocumentService } from '@/services/project-document-service';
import { toast } from '@/lib/styles/toast-styles';
import { inspectionKeys, projectDocumentKeys } from './keys';

/** The project's document library — drawings, specs, permits. */
export function useProjectDocuments(projectId: number | undefined) {
  return useQuery({
    queryKey: projectDocumentKeys.byProject(projectId ?? 0),
    queryFn: () => projectDocumentService.getByProject(projectId as number),
    enabled: Boolean(projectId),
  });
}

export function useAttachDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      documentIds,
    }: {
      inspectionId: number;
      documentIds: number[];
    }) => projectDocumentService.attachToInspection(inspectionId, documentIds),
    onSuccess: (inspection, { documentIds }) => {
      queryClient.setQueryData(
        inspectionKeys.detail(inspection.id),
        inspection
      );
      toast.success(
        documentIds.length === 1
          ? 'Document attached'
          : `${documentIds.length} documents attached`
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDetachDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      documentId,
    }: {
      inspectionId: number;
      documentId: number;
    }) => projectDocumentService.detachFromInspection(inspectionId, documentId),
    onSuccess: (inspection) => {
      queryClient.setQueryData(
        inspectionKeys.detail(inspection.id),
        inspection
      );
      toast.success('Document removed');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
