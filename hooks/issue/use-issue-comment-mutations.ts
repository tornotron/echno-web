import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueCommentService } from '@/services/issue-comment-service';
import { IssueComment } from '@/types/issue/issue-comment';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

/**
 * useCreateIssueComment
 *
 * Mutation hook to create a new comment on an issue.
 * Invalidates both the comments cache and the parent issue cache
 * since comments are embedded in the issue response.
 */
export function useCreateIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      data,
    }: {
      issueId: number;
      data: Partial<IssueComment>;
    }) => issueCommentService.create(issueId, data),
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

/**
 * useUpdateIssueComment
 *
 * Mutation hook to update an existing issue comment.
 */
export function useUpdateIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IssueComment> }) =>
      issueCommentService.update(id, data),
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

/**
 * useDeleteIssueComment
 *
 * Mutation hook that deletes an issue comment by id and invalidates
 * both the comments cache and the parent issues cache.
 */
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
