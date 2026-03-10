import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEmployees } from '@/hooks/employee/use-employee';
import { useProjects } from '@/hooks/project/use-projects';
import { useOrganizations } from '@/hooks/organization/use-organizations';
import { useLeaveRequest } from '@/hooks/leave/use-leave';
import { useTask } from '@/hooks/task/use-tasks';
import { useIssue } from '@/hooks/issue/use-issues';
import { useChatRoom } from '@/hooks/chat/use-chat-rooms';
import { useVendor } from '@/hooks/vendors/use-vendors';
import { Employee } from '@/types/employee/employee';
import { Project } from '@/types/project/project';
import { Organization } from '@/types/organization';
import { LeaveRequest } from '@/types/leave';
import { Task } from '@/types/task';
import { Issue } from '@/types/issue/issue';
import { ChatRoom } from '@/types/chat';
import { Vendor } from '@/types/vendor';

interface BreadcrumbData {
  employees?: Employee[];
  projects?: Project[];
  organizations?: Organization[];
  leaveRequest?: LeaveRequest;
  task?: Task;
  issue?: Issue;
  chatRoom?: ChatRoom;
  vendor?: Vendor;
}

/**
 * useBreadcrumbData
 *
 * Custom hook that extracts breadcrumb-related business logic from components.
 * Parses the current pathname to extract IDs and conditionally fetches
 * only the necessary data for breadcrumb display.
 *
 * This hook:
 * - Uses regex to parse leave request and task IDs from the pathname
 * - Conditionally fetches leave request and task details only when IDs exist
 * - Fetches employees, projects, and organizations for name lookups
 * - Memoizes pathname parsing to avoid redundant computations
 *
 * @returns {BreadcrumbData} Object containing data needed for breadcrumbs
 */
export function useBreadcrumbData(): BreadcrumbData {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse pathname and query params for entity IDs
  const { leaveRequestId, taskId, issueId, chatRoomId, vendorId } =
    useMemo(() => {
      // Extract leave request ID from path if present
      const leaveRequestIdMatch = pathname.match(/\/leaves\/requests\/(\d+)/);
      const leaveRequestId = leaveRequestIdMatch
        ? Number.parseInt(leaveRequestIdMatch[1], 10)
        : undefined;

      // Extract task ID from path, falling back to ?taskId= query param
      // (used when navigating to an issue from a task details page)
      const taskIdMatch = pathname.match(/\/tasks\/(\d+)/);
      const taskIdFromPath = taskIdMatch
        ? Number.parseInt(taskIdMatch[1], 10)
        : undefined;
      const taskIdFromQuery = searchParams.get('taskId');
      const parsedTaskIdFromQuery = taskIdFromQuery
        ? Number.parseInt(taskIdFromQuery, 10)
        : undefined;
      const taskId =
        taskIdFromPath ??
        (Number.isFinite(parsedTaskIdFromQuery)
          ? parsedTaskIdFromQuery
          : undefined);

      // Extract issue ID from path if present
      const issueIdMatch = pathname.match(/\/issues\/(\d+)/);
      const issueId = issueIdMatch
        ? Number.parseInt(issueIdMatch[1], 10)
        : undefined;

      const chatRoomIdMatch = pathname.match(/\/chat\/(\d+)/);
      const chatRoomId = chatRoomIdMatch
        ? Number.parseInt(chatRoomIdMatch[1], 10)
        : undefined;

      const vendorIdMatch = pathname.match(/\/vendors\/(\d+)/);
      const vendorId = vendorIdMatch
        ? Number.parseInt(vendorIdMatch[1], 10)
        : undefined;

      return { leaveRequestId, taskId, issueId, chatRoomId, vendorId };
    }, [pathname, searchParams]);

  // Fetch data for breadcrumbs
  // Note: These full lists are needed for name lookups in breadcrumbs
  // Could be optimized further with server-side name resolution if needed
  const { data: employees } = useEmployees();
  const { data: projects } = useProjects();
  const { data: organizations } = useOrganizations();

  // Conditionally fetch leave request details only when ID exists
  const { data: leaveRequest } = useLeaveRequest(
    leaveRequestId ?? 0,
    !!leaveRequestId
  );

  // Conditionally fetch task details only when ID exists
  const { data: task } = useTask(taskId);

  // Conditionally fetch issue details only when ID exists
  const { data: issue } = useIssue(issueId);

  // Conditionally fetch chat room details only when ID exists
  const { data: chatRoom } = useChatRoom(chatRoomId);

  // Conditionally fetch vendor details only when ID exists
  const { data: vendor } = useVendor(vendorId ?? 0);

  return {
    employees,
    projects,
    organizations,
    leaveRequest,
    task,
    issue,
    chatRoom,
    vendor,
  };
}
