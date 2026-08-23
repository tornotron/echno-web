import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { issueKeys } from '@tornotron/echno-core/issue/hooks/keys';
import type { Issue } from '@tornotron/echno-core/issue/types';
import type { Employee } from '@tornotron/echno-core/employee/types';
import {
  issuesService,
  type IssuePageQueryParams,
} from '@/services/issues-service';

/**
 * Joins `creator` and `assignee` onto each issue by looking up their ids in the
 * supplied employee list. Mirrors the resolution the core `useIssuesPage`
 * performs, kept here because the local service reuses the raw `parseIssue`
 * (which leaves those joined entities undefined).
 */
function resolveEmployees(issues: Issue[], employees: Employee[]): Issue[] {
  return issues.map((issue) => ({
    ...issue,
    creator: issue.creatorId
      ? employees.find((e) => e.id === issue.creatorId)
      : undefined,
    assignee: issue.assigneeId
      ? employees.find((e) => e.id === issue.assigneeId)
      : undefined,
  }));
}

/**
 * Fetches one page of issues, forwarding the `assigneeId` / `creatorId`
 * employee filters (#35 phase 2) to the backend. A drop-in replacement for the
 * core `useIssuesPage`: same paged shape, same query key (so mutations that
 * invalidate `issueKeys.pages()` still clear it), with `creator` / `assignee`
 * resolved from the org-wide and user-scoped employee caches.
 */
export function useIssuesPage(params: IssuePageQueryParams) {
  const issuesQuery = useQuery({
    queryKey: issueKeys.page(params),
    queryFn: () => issuesService.getPage(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEmployees = [] } = useEmployees();
  const { data: userEmployees = [] } = useUserEmployees();

  const employees = useMemo(() => {
    const map = new Map<number, Employee>();
    for (const e of [...allEmployees, ...userEmployees]) {
      if (e.id !== undefined) map.set(e.id, e);
    }
    return [...map.values()];
  }, [allEmployees, userEmployees]);

  const data = useMemo(
    () =>
      issuesQuery.data
        ? {
            ...issuesQuery.data,
            content: resolveEmployees(issuesQuery.data.content, employees),
          }
        : issuesQuery.data,
    [issuesQuery.data, employees]
  );

  return { ...issuesQuery, data };
}
