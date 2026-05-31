import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService } from '@/services/issue-service';
import { Issue, IssueFiles } from '@/types/issue';
import { CreateIssueRequest } from '@/types/issue/issue-create';
import { UpdateIssueRequest } from '@/types/issue/issue-update';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { mergePreservingNested } from '@/lib/query/cache-merge';
import { issueKeys } from './issue-keys';
import { taskKeys } from '@/hooks/task/task-keys';

const ISSUE_NESTED_KEYS = [
  'comments',
  'attachments',
  'taskName',
] as const satisfies ReadonlyArray<keyof Issue>;

/**
 * Matches every Issue[] list cache under the 'issues' namespace while excluding
 * detail entries (Issue), which have a numeric second segment (`['issues', id]`).
 * Used by `setQueriesData` to batch-patch the main list and every `byProject` /
 * `byTask` cache in one call.
 */
function isIssueListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key[0] === 'issues' &&
    key.length > 1 &&
    typeof key[1] !== 'number'
  );
}

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
    onSuccess: (newIssue, { data }) => {
      // POST /issues/web → IssueSimpleDto — nested arrays (comments, attachments)
      // and joined fields (taskName) may be absent. Seed for instant nav;
      // invalidate detail so the next observer refetches the canonical IssueDto.
      queryClient.setQueryData<Issue[]>(issueKeys.lists(), (old) =>
        old ? [...old, newIssue] : [newIssue]
      );
      queryClient.setQueryData<Issue>(issueKeys.detail(newIssue.id), newIssue);
      queryClient.invalidateQueries({
        queryKey: issueKeys.detail(newIssue.id),
      });

      // Append to scoped lists only if they're already in cache. Functional
      // updater returns undefined for absent entries, avoiding spurious caches.
      if (data.taskId !== undefined) {
        queryClient.setQueryData<Issue[]>(
          issueKeys.byTask(data.taskId),
          (old) => (old ? [...old, newIssue] : undefined)
        );
        // Task detail caches `issues` nested array — invalidate so the task
        // view picks up the new issue. Cross-namespace: project module owns
        // the Task cache shape.
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(data.taskId),
        });
      }
      if (data.projectId !== undefined) {
        queryClient.setQueryData<Issue[]>(
          issueKeys.byProject(data.projectId),
          (old) => (old ? [...old, newIssue] : undefined)
        );
      }

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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: issueKeys.detail(id) });
      await queryClient.cancelQueries({ predicate: isIssueListCache });

      const previousDetail = queryClient.getQueryData<Issue>(
        issueKeys.detail(id)
      );
      const previousListEntries = queryClient.getQueriesData<Issue[]>({
        predicate: isIssueListCache,
      });

      // Build optimistic snapshot from detail cache, falling back to any list
      // entry. Only deterministic scalar fields are applied; joined objects
      // (creator, assignee, category) require cache lookups and are resolved
      // by onSuccess's merge + invalidate. Note: `issueType` (request DTO) maps
      // to `type` on the Issue interface.
      const base =
        previousDetail ??
        previousListEntries
          .flatMap(([, items]) => items ?? [])
          .find((i) => i.id === id);

      if (base) {
        const optimisticIssue: Issue = {
          ...base,
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.issueType !== undefined && { type: data.issueType }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.assigneeId !== undefined && {
            assigneeId: data.assigneeId ?? undefined,
          }),
        };
        queryClient.setQueryData<Issue>(issueKeys.detail(id), optimisticIssue);
        queryClient.setQueriesData<Issue[]>(
          { predicate: isIssueListCache },
          (old) => old?.map((i) => (i.id === id ? optimisticIssue : i))
        );
      }

      return { previousDetail, previousListEntries };
    },
    onSuccess: (updatedIssue, { id }) => {
      // PATCH /issues/web/{id} → IssueSimpleDto — nested arrays (comments,
      // attachments) and joined fields (taskName) absent. Merge preserves
      // cached nested data; invalidate triggers a canonical refetch.
      const merge = (old: Issue | undefined): Issue =>
        old
          ? mergePreservingNested(old, updatedIssue, ISSUE_NESTED_KEYS)
          : updatedIssue;
      queryClient.setQueryData<Issue>(issueKeys.detail(id), merge);
      queryClient.setQueriesData<Issue[]>(
        { predicate: isIssueListCache },
        (old) => old?.map((i) => (i.id === id ? merge(i) : i))
      );
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
      queryClient.invalidateQueries({ predicate: isIssueListCache });

      // Cross-namespace: task detail caches the Issue[] for that task and may
      // show stale title/status. Invalidate when we know the task association.
      if (updatedIssue.taskId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(updatedIssue.taskId),
        });
      }

      toast.success('Issue Updated', {
        description: 'The issue has been updated successfully',
      });
    },
    onError: (error, { id }, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData<Issue>(
          issueKeys.detail(id),
          context.previousDetail
        );
      }
      for (const [key, value] of context?.previousListEntries ?? []) {
        queryClient.setQueryData<Issue[]>(key, value);
      }
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: issueKeys.detail(id) });
      await queryClient.cancelQueries({ predicate: isIssueListCache });

      const previousDetail = queryClient.getQueryData<Issue>(
        issueKeys.detail(id)
      );
      const previousListEntries = queryClient.getQueriesData<Issue[]>({
        predicate: isIssueListCache,
      });

      // Apply deletion immediately — removed from all list caches and detail evicted.
      queryClient.setQueriesData<Issue[]>(
        { predicate: isIssueListCache },
        (old) => old?.filter((i) => i.id !== id)
      );
      queryClient.removeQueries({ queryKey: issueKeys.detail(id) });

      return { previousDetail, previousListEntries };
    },
    onSuccess: (_data, _id, context) => {
      // DELETE /issues/web/{id} → ApiResponse (ack).
      // Cache was already updated optimistically in onMutate. Just trigger the
      // cross-namespace task invalidation from the pre-deletion snapshot.
      if (context?.previousDetail?.taskId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(context.previousDetail.taskId),
        });
      }

      toast.success('Issue Deleted', {
        description: 'The issue has been deleted successfully',
      });
    },
    onError: (error, id, context) => {
      // Restore list caches from snapshot.
      for (const [key, value] of context?.previousListEntries ?? []) {
        queryClient.setQueryData<Issue[]>(key, value);
      }
      // Re-seed detail if it was present before the optimistic deletion.
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData<Issue>(
          issueKeys.detail(id),
          context.previousDetail
        );
      }
      const title = getErrorTitle(error, 'Failed to Delete Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete issue:', error);
    },
  });
}
