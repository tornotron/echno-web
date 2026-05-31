import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService } from '@/services/issue-service';
import { IssueFiles } from '@/types/issue';
import { CreateIssueRequest } from '@/types/issue/issue-create';
import { UpdateIssueRequest } from '@/types/issue/issue-update';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { issueKeys } from './issue-keys';

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: CreateIssueRequest;
      files?: IssueFiles;
    }) => issueService.create(data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
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

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: UpdateIssueRequest;
      files?: IssueFiles;
    }) => issueService.update(id, data, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
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

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.delete,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
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
