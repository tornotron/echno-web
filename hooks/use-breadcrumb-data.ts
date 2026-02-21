import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useEmployees } from '@/hooks/employee/use-employee';
import { useProjects } from '@/hooks/project/use-projects';
import { useOrganizations } from '@/hooks/organization/use-organizations';
import { useLeaveRequest } from '@/hooks/leave/use-leave';
import { useTask } from '@/hooks/task/use-tasks';
import { Employee } from '@/types/employee/employee';
import { Project } from '@/types/project/project';
import { Organization } from '@/types/organization';
import { LeaveRequest } from '@/types/leave';
import { Task } from '@/types/task';

interface BreadcrumbData {
  employees?: Employee[];
  projects?: Project[];
  organizations?: Organization[];
  leaveRequest?: LeaveRequest;
  task?: Task;
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

  // Parse pathname for entity IDs - memoized to avoid re-parsing on every render
  const { leaveRequestId, taskId } = useMemo(() => {
    // Extract leave request ID from path if present
    const leaveRequestIdMatch = pathname.match(/\/leaves\/requests\/(\d+)/);
    const leaveRequestId = leaveRequestIdMatch
      ? Number.parseInt(leaveRequestIdMatch[1], 10)
      : undefined;

    // Extract task ID from path if present
    const taskIdMatch = pathname.match(/\/tasks\/(\d+)/);
    const taskId = taskIdMatch
      ? Number.parseInt(taskIdMatch[1], 10)
      : undefined;

    return { leaveRequestId, taskId };
  }, [pathname]);

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

  return {
    employees,
    projects,
    organizations,
    leaveRequest,
    task,
  };
}
