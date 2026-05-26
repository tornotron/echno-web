import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueCommentService } from '@/services/issue-comment-service';
import { CreateIssueCommentRequest } from '@/types/issue/issue-create';
import { UpdateIssueCommentRequest } from '@/types/issue/issue-update';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

export function useCreateIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateIssueCommentRequest) =>
      issueCommentService.create(dto),
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', issueId] });
      toast.success('Comment Added', {
        description: 'Your comment has been added successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Add Comment');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create issue comment:', error);
    },
  });
}

export function useUpdateIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateIssueCommentRequest;
    }) => issueCommentService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments'] });
      queryClient.invalidateQueries({ queryKey: ['issue-comments', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Comment Updated', {
        description: 'The comment has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Comment');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update issue comment:', error);
    },
  });
}

export function useDeleteIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueCommentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Comment Deleted', {
        description: 'The comment has been deleted successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Comment');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete issue comment:', error);
    },
  });
}
