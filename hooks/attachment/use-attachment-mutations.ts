import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentService } from '@/services/attachment-service';
import { Attachment } from '@/types/attachment';

/**
 * Hook to upload an attachment for an entity.
 * Returns mutation handlers for upload operation.
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadAttachment();
 *
 * const handleUpload = async (file: File) => {
 *   const attachment = await uploadMutation.mutateAsync({
 *     entityId: userId,
 *     entityType: 'USER_PROFILE_PICTURE',
 *     files: file,
 *   });
 * };
 * ```
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      entityId: number;
      entityType: string;
      files: File | File[];
    }) =>
      attachmentService.upload(
        variables.entityId,
        variables.entityType,
        variables.files
      ),
    onSuccess: (attachment: Attachment, variables) => {
      // Update cache with new attachment
      if (attachment.id) {
        queryClient.setQueryData(['attachments', attachment.id], attachment);
      }
      // Also update the entity attachment cache
      queryClient.setQueryData(
        ['attachments', 'entity', variables.entityId, variables.entityType],
        attachment
      );
    },
  });
}

/**
 * Hook to delete an attachment.
 * Returns mutation handlers for delete operation.
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteAttachment();
 *
 * const handleDelete = async () => {
 *   await deleteMutation.mutateAsync(attachmentId);
 * };
 * ```
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => attachmentService.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['attachments', id] });
      // Invalidate entity attachment queries to refetch
      queryClient.invalidateQueries({
        queryKey: ['attachments', 'entity'],
        refetchType: 'active',
      });
      // Invalidate projects queries to refetch project data with updated attachments
      queryClient.invalidateQueries({
        queryKey: ['projects'],
        refetchType: 'active',
      });
    },
  });
}
