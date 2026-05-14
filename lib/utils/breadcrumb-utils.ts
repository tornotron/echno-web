/**
 * lib/utils/breadcrumb-utils.ts
 *
 * Utility functions used by the breadcrumbs component to resolve
 * human-readable names for dynamic ID segments in the URL.
 */

import { Employee } from '@/types/employee/employee';
import { LeaveRequest } from '@/types/leave';
import { Organization } from '@/types/organization';
import { Task } from '@/types/task';
import { Issue } from '@/types/issue/issue';
import { Project } from '@/types/project/project';
import { Vendor } from '@/types/vendor';
import { Material } from '@/types/materials';
import { Indent } from '@/types/indents';
import { StorageLocation } from '@/types/storage-locations/storage-location';
import { PurchaseOrder } from '@/types/purchase-orders';
import { leaveFromMap } from '@/lib/utils/leave-path-map';

/**
 * Optional callback used by `getNameForId` to resolve names for segments
 * that are not yet backed by real API data (e.g. mock/placeholder modules).
 * Receives the parent segment and the numeric ID, and should return a
 * human-readable name or `undefined` to fall back to the raw ID.
 */
export type FallbackNameResolver = (
  parentSegment: string,
  numericId: number
) => string | undefined;

/** Data structure for breadcrumb items used in the UI.
 *
 * @param href              – The URL the breadcrumb points to.
 * @param label             – The display label for the breadcrumb.
 * @param fullName          – The full, non-truncated name (used for tooltips).
 * @param isLast            – Whether this is the last breadcrumb (current page).
 * @param isNonInteractive  – Whether this breadcrumb should be rendered as plain text (not a link).
 * @param isTruncated       – Whether the label has been truncated and should show a tooltip.
 */

export interface BreadcrumbItemData {
  href: string;
  label: string;
  fullName: string;
  isLast: boolean;
  isNonInteractive: boolean;
  isTruncated: boolean;
}

/**
 * Resolve a human-readable name for a numeric/UUID segment in the URL.
 *
 * @param id       – The raw ID segment from the URL.
 * @param context  – All path segments *before* the ID (used to determine the parent resource).
 * @param employees     – Optional list of employees for lookup.
 * @param leaveRequests – Optional list of leave requests for lookup.
 * @param organizations – Optional list of organizations for lookup.
 * @param projects      – Optional list of projects for lookup.
 * @param task              – Optional single task for lookup.
 * @param issue             – Optional single issue for lookup.
 * @param fallbackResolver  – Optional callback for segments backed by mock/placeholder data.
 */
export function getNameForId(
  id: string,
  context: string[],
  employees?: Employee[],
  leaveRequests?: LeaveRequest[],
  organizations?: Organization[],
  projects?: Project[],
  task?: Task,
  issue?: Issue,
  chatRoomName?: string,
  fallbackResolver?: FallbackNameResolver,
  vendor?: Vendor,
  material?: Material,
  indent?: Indent,
  storageLocation?: StorageLocation,
  purchaseOrder?: PurchaseOrder
): string {
  const numericId = Number.parseInt(id, 10);
  const parentSegment = context.at(-1);

  if (parentSegment === 'chat') {
    return chatRoomName ?? `Room ${id}`;
  }

  if (parentSegment === 'vendors') {
    return vendor?.name ?? `Vendor ${id}`;
  }

  if (parentSegment === 'materials') {
    return material?.materialName ?? `Material ${id}`;
  }

  if (parentSegment === 'indents') {
    return indent?.indentNumber ?? `Indent ${id}`;
  }

  if (parentSegment === 'storage-locations') {
    return storageLocation?.locationName ?? `Location ${id}`;
  }

  if (parentSegment === 'purchase-orders') {
    return purchaseOrder?.poNumber ?? `PO ${id}`;
  }

  if (parentSegment === 'projects' || parentSegment === 'all-projects') {
    return (
      projects?.find((p) => p.id === numericId)?.projectName ?? `Project ${id}`
    );
  }
  if (parentSegment === 'tasks') {
    return task?.title ?? `Task ${id}`;
  }
  if (parentSegment === 'issues') {
    return issue?.title ?? `Issue ${id}`;
  }
  if (
    parentSegment === 'employees' ||
    parentSegment === 'employee-management' ||
    parentSegment === 'attendance'
  ) {
    // Use real employee data if available, filtering out undefined IDs
    return (
      employees?.find((e) => e.id !== undefined && e.id === numericId)?.name ??
      'Employee'
    );
  }
  if (parentSegment === 'requests' && context.includes('leaves')) {
    // Use real leave request data if available
    return (
      leaveRequests?.find((r) => r.id === numericId)?.requestNumber ??
      `Request #${id}`
    );
  }
  if (parentSegment === 'organizations') {
    // Use real organization data if available
    return (
      organizations?.find((o) => o.id === numericId)?.organizationName ??
      `Organization ${id}`
    );
  }
  // Delegate to the fallback resolver for segments backed by mock/placeholder data
  if (parentSegment && fallbackResolver) {
    const resolved = fallbackResolver(parentSegment, numericId);
    if (resolved !== undefined) return resolved;
  }

  return id;
}

// ---------------------------------------------------------------------------
// truncateText — also used by overrides that insert new breadcrumb segments
// ---------------------------------------------------------------------------

export function truncateText(text: string, maxLength: number = 30): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
}

// ---------------------------------------------------------------------------
// Breadcrumb override helpers
// ---------------------------------------------------------------------------

/** Recalculate `isLast` on every item after a splice / removal.
 * Call this after mutating the breadcrumb items array to ensure the last item is correctly marked.
 *
 * @param items – The breadcrumb items array to update in place.
 */
function recalcIsLast(items: BreadcrumbItemData[]): void {
  for (const [i, item] of items.entries()) {
    item.isLast = i === items.length - 1;
  }
}

/**
 * Apply all contextual breadcrumb overrides **in place**.
 *
 * Call this after the initial breadcrumb items have been built from the URL
 * segments. It inspects `pathname` and `searchParams` to decide which
 * overrides to apply.
 *
 * @param items        – The mutable array of breadcrumb items.
 * @param pathname     – The current URL pathname.
 * @param searchParams – The current URL search params.
 * @param task         – Optional task data (needed by issue-from-task overrides).
 */
export function applyBreadcrumbOverrides(
  items: BreadcrumbItemData[],
  pathname: string,
  searchParams: URLSearchParams,
  task?: Task
): void {
  const fromParam = searchParams.get('from');
  const taskIdParam = searchParams.get('taskId');
  const editParam = searchParams.get('edit');

  // 1. Leave request detail — override "Requests" / "My Requests" based on `from`
  const isLeaveRequestDetail = /\/workforce\/leaves\/requests\/\d+$/.test(
    pathname
  );
  if (isLeaveRequestDetail && fromParam && leaveFromMap[fromParam]) {
    const override = leaveFromMap[fromParam];
    const requestsIndex = items.findIndex(
      (item) => item.label === 'Requests' || item.label === 'My Requests'
    );
    if (requestsIndex !== -1) {
      if (override.label === 'Leave Management') {
        // From a dashboard — remove the "My Requests" breadcrumb since
        // "Leave Management" is already shown from the `leaves` segment
        items.splice(requestsIndex, 1);
        recalcIsLast(items);
      } else {
        // From a different list page — override the label and href
        items[requestsIndex] = {
          ...items[requestsIndex],
          label: override.label,
          fullName: override.label,
          href: override.href,
          isTruncated: false,
        };
      }
    }
  }

  // 2. Issue detail from task — replace "Issues" with Tasks ▸ [Task Title]
  const isIssueDetailPage = /\/issues\/\d+/.test(pathname);
  if (isIssueDetailPage && fromParam === 'task' && taskIdParam && task) {
    const issuesIndex = items.findIndex((item) => item.label === 'Issues');
    if (issuesIndex !== -1) {
      const projectHref = items[issuesIndex].href.replace('/issues', '');

      const taskTitleFull = task.title;
      const taskTitleLabel = truncateText(taskTitleFull);

      items.splice(
        issuesIndex,
        1,
        {
          href: `${projectHref}/tasks`,
          label: 'Tasks',
          fullName: 'Tasks',
          isLast: false,
          isNonInteractive: false,
          isTruncated: false,
        },
        {
          href: `${projectHref}/tasks/${taskIdParam}`,
          label: taskTitleLabel,
          fullName: taskTitleFull,
          isLast: false,
          isNonInteractive: false,
          isTruncated: taskTitleLabel !== taskTitleFull,
        }
      );

      recalcIsLast(items);
    }
  }

  // 3. New issue from task — same replacement but keeps the trailing "New"
  const isNewIssuePage = pathname.endsWith('/issues/new');
  if (isNewIssuePage && taskIdParam && task) {
    const issuesIndex = items.findIndex((item) => item.label === 'Issues');
    if (issuesIndex !== -1) {
      const projectHref = items[issuesIndex].href.replace('/issues', '');

      const taskTitleFull = task.title;
      const taskTitleLabel = truncateText(taskTitleFull);

      items.splice(
        issuesIndex,
        1,
        {
          href: `${projectHref}/tasks`,
          label: 'Tasks',
          fullName: 'Tasks',
          isLast: false,
          isNonInteractive: false,
          isTruncated: false,
        },
        {
          href: `${projectHref}/tasks/${taskIdParam}`,
          label: taskTitleLabel,
          fullName: taskTitleFull,
          isLast: false,
          isNonInteractive: false,
          isTruncated: taskTitleLabel !== taskTitleFull,
        }
      );

      recalcIsLast(items);
    }
  }

  // 4. Leave apply in edit mode — relabel "Apply for Leave" → "Edit Leave Request"
  const isLeaveApplyPage = pathname.endsWith('/workforce/leaves/apply');
  if (isLeaveApplyPage && editParam) {
    const applyIndex = items.findIndex(
      (item) => item.label === 'Apply for Leave'
    );
    if (applyIndex !== -1) {
      items[applyIndex] = {
        ...items[applyIndex],
        label: 'Edit Leave Request',
        fullName: 'Edit Leave Request',
        isTruncated: false,
      };
    }
  }
}
