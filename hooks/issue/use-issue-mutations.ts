import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService, IssueFiles } from '@/services/issue-service';
import { Issue } from '@/types/issue/issue';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

/**
 * useCreateIssueWithFiles
 *
 * Mutation hook to create a new issue with optional file attachments.
 */
export function useCreateIssueWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: Partial<Issue>;
      files: IssueFiles;
    }) => issueService.createWithFiles(data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue Created', {
        description: 'The issue has been created successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Create Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create issue:', error);
    },
  });
}

/**
 * useUpdateIssueWithFiles
 *
 * Mutation hook to update an existing issue with optional file attachments.
 */
export function useUpdateIssueWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: Partial<Issue>;
      files: IssueFiles;
    }) => issueService.updateWithFiles(id, data, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', id] });
      toast.success('Issue Updated', {
        description: 'The issue has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update issue:', error);
    },
  });
}

/**
 * useDeleteIssue
 *
 * Mutation hook that deletes an issue by id and invalidates the
 * `['issues']` cache entry on success.
 */
export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.delete,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', id] });
      toast.success('Issue Deleted', {
        description: 'The issue has been deleted successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete issue:', error);
    },
  });
}
