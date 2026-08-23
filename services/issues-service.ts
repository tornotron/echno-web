import { api } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { parseIssue } from '@tornotron/echno-core/issue/types';
import type { Issue } from '@tornotron/echno-core/issue/types';
import type {
  IssuePageParams,
  PagedIssue,
} from '@tornotron/echno-core/issue/services';

/**
 * Page params for the paginated issue list, extended with the employee filters
 * introduced in #35 phase 2. `assigneeId` restricts the page to issues assigned
 * to an employee; `creatorId` restricts it to issues they reported. Both are
 * forwarded to the backend as query params.
 */
export interface IssuePageQueryParams extends IssuePageParams {
  /** Restrict to issues assigned to this employee (backend `assigneeId`). */
  assigneeId?: number;
  /** Restrict to issues created by this employee (backend `creatorId`). */
  creatorId?: number;
}

/** Paginated issue endpoint, relative to the `/api/v1` BFF base. */
const PAGINATED = '/issues/web/paginated';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * Translates page params into the backend query object. Mirrors the core issue
 * service's mapping and adds the `assigneeId` / `creatorId` filters.
 */
export function buildIssuePageQuery(
  params: IssuePageQueryParams
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.pageNo = params.page;
  if (params.size !== undefined) query.pageSize = params.size;
  if (params.projectId !== undefined) query.projectId = params.projectId;
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.type) query.type = params.type;
  if (params.assigneeId !== undefined) query.assigneeId = params.assigneeId;
  if (params.creatorId !== undefined) query.creatorId = params.creatorId;
  return query;
}

function safeParseIssues(rows: Raw[]): Issue[] {
  const parsed: Issue[] = [];
  for (const row of rows) {
    try {
      parsed.push(parseIssue(row));
    } catch (error) {
      logger.error('Failed to parse issue:', error);
    }
  }
  return parsed;
}

/**
 * Normalizes the Spring `Page<IssueDto>` envelope into {@link PagedIssue},
 * mirroring the core issue service so callers always receive page metadata.
 * Joined `creator` / `assignee` are left for the hook to resolve.
 */
function toPagedIssue(data: Raw, params: IssuePageQueryParams): PagedIssue {
  if (Array.isArray(data)) {
    const content = safeParseIssues(data);
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
      size: params.size ?? content.length,
    };
  }
  return {
    content: safeParseIssues(data?.content ?? []),
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    number: data?.number ?? 0,
    size: data?.size ?? params.size ?? 10,
  };
}

/**
 * Backend-backed paginated issue list. Wraps the same `/issues/web/paginated`
 * endpoint the core service uses, but also forwards the `assigneeId` /
 * `creatorId` employee filters (#35 phase 2). Kept in the web app because the
 * published core client does not yet carry these params.
 */
export const issuesService = {
  async getPage(params: IssuePageQueryParams): Promise<PagedIssue> {
    const data = await api.get<Raw>(PAGINATED, buildIssuePageQuery(params));
    return toPagedIssue(data, params);
  },
};
