import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEmployee } from '@tornotron/echno-core/employee/hooks';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useOrganizations } from '@tornotron/echno-core/organization/hooks';
import { useLeaveRequest } from '@/hooks/leave/use-leave';
import { useTask } from '@tornotron/echno-core/task/hooks';
import { useIssue } from '@tornotron/echno-core/issue/hooks';
import { useChatRoom } from '@/hooks/chat/use-chat-rooms';
import { useVendor } from '@tornotron/echno-core/vendor/hooks';
import { useMaterial } from '@tornotron/echno-core/materials/hooks';
import { useIndent } from '@tornotron/echno-core/indents/hooks';
import { useStorageLocation } from '@tornotron/echno-core/storage-locations/hooks';
import { useLabourById } from '@tornotron/echno-core/labour/hooks';
import { usePurchaseOrder } from '@tornotron/echno-core/purchase-orders/hooks';
import { useSiteTransfer } from '@tornotron/echno-core/site-transfers/hooks';
import { Employee } from '@tornotron/echno-core/employee/types';
import { Project } from '@tornotron/echno-core/project/types';
import { Organization } from '@tornotron/echno-core/organization/types';
import { LeaveRequest } from '@/types/leave';
import { Task } from '@tornotron/echno-core/task/types';
import { Issue } from '@tornotron/echno-core/issue/types';
import { ChatRoom } from '@/types/chat';
import { Vendor } from '@tornotron/echno-core/vendor/types';
import { Material } from '@tornotron/echno-core/materials/types';
import { Indent } from '@tornotron/echno-core/indents/types';
import { StorageLocation } from '@tornotron/echno-core/storage-locations/types';
import { Labour } from '@tornotron/echno-core/labour/types';
import { PurchaseOrder } from '@tornotron/echno-core/purchase-orders/types';
import { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';

interface BreadcrumbData {
  employee?: Employee;
  project?: Project;
  organizations?: Organization[];
  leaveRequest?: LeaveRequest;
  task?: Task;
  issue?: Issue;
  chatRoom?: ChatRoom;
  vendor?: Vendor;
  material?: Material;
  indent?: Indent;
  storageLocation?: StorageLocation;
  purchaseOrder?: PurchaseOrder;
  labour?: Labour;
  siteTransfer?: SiteTransfer;
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
 * - Resolves the one employee and the one project the path names, by id
 * - Memoizes pathname parsing to avoid redundant computations
 *
 * Every entity here is fetched by id. The employee and project names used to come from whole-
 * collection reads that ran on every route, including the routes whose breadcrumbs name neither,
 * which meant the application shell downloaded the tenant's entire employee directory to render at
 * most one name from it.
 *
 * @returns {BreadcrumbData} Object containing data needed for breadcrumbs
 */
function parseIdFromPath(pathname: string, regex: RegExp): number | undefined {
  const match = pathname.match(regex);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

export function useBreadcrumbData(): BreadcrumbData {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse pathname and query params for entity IDs
  const {
    employeeId,
    projectId,
    leaveRequestId,
    taskId,
    issueId,
    chatRoomId,
    vendorId,
    materialId,
    indentId,
    storageLocationId,
    purchaseOrderId,
    labourId,
    siteTransferId,
  } = useMemo(() => {
    const leaveRequestId = parseIdFromPath(
      pathname,
      /\/leaves\/.+\/requests\/(\d+)/
    );

    // Extract task ID from path, falling back to ?taskId= query param
    // (used when navigating to an issue from a task details page)
    const taskIdFromPath = parseIdFromPath(pathname, /\/tasks\/(\d+)/);
    const taskIdFromQuery = searchParams.get('taskId');
    const parsedTaskIdFromQuery = taskIdFromQuery
      ? Number.parseInt(taskIdFromQuery, 10)
      : undefined;
    const taskId =
      taskIdFromPath ??
      (Number.isFinite(parsedTaskIdFromQuery)
        ? parsedTaskIdFromQuery
        : undefined);

    // The parent segments here are the ones breadcrumb-utils resolves against an
    // employee or a project, so a path that names neither fetches neither.
    const employeeId = parseIdFromPath(
      pathname,
      /\/(?:employees|employee-management|attendance)\/(\d+)/
    );
    const projectId = parseIdFromPath(
      pathname,
      /\/(?:projects|all-projects)\/(\d+)/
    );

    const issueId = parseIdFromPath(pathname, /\/issues\/(\d+)/);
    const chatRoomId = parseIdFromPath(pathname, /\/chat\/(\d+)/);
    const vendorId = parseIdFromPath(pathname, /\/vendors\/(\d+)/);
    const materialId = parseIdFromPath(pathname, /\/materials\/(\d+)/);
    const indentId = parseIdFromPath(pathname, /\/indents\/(\d+)/);
    const storageLocationId = parseIdFromPath(
      pathname,
      /\/storage-locations\/(\d+)/
    );
    const purchaseOrderId = parseIdFromPath(
      pathname,
      /\/purchase-orders\/(\d+)/
    );
    const labourId = parseIdFromPath(pathname, /\/labour\/(\d+)/);
    const siteTransferId = parseIdFromPath(pathname, /\/transfers\/(\d+)/);

    return {
      employeeId,
      projectId,
      leaveRequestId,
      taskId,
      issueId,
      chatRoomId,
      vendorId,
      materialId,
      indentId,
      storageLocationId,
      purchaseOrderId,
      labourId,
      siteTransferId,
    };
  }, [pathname, searchParams]);

  // Resolve the single employee and single project the path names. Both hooks stay
  // disabled while their id is undefined, so a route that names neither is free.
  const { data: employee } = useEmployee(employeeId ?? 0);
  const { data: project } = useProject(projectId);

  // The organization list is small, and the shell already holds it for the
  // organization switcher, so this reads the same cache rather than a second request.
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

  // Conditionally fetch material details only when ID exists
  const { data: material } = useMaterial(materialId ?? 0);

  // Conditionally fetch indent details only when ID exists
  const { data: indent } = useIndent(indentId ?? 0);

  // Conditionally fetch storage location details only when ID exists
  const { data: storageLocation } = useStorageLocation(storageLocationId ?? 0);

  // Conditionally fetch purchase order details only when ID exists
  const { data: purchaseOrder } = usePurchaseOrder(purchaseOrderId ?? 0);

  // Conditionally fetch labour details only when ID exists
  const { data: labour } = useLabourById(labourId ?? 0);

  // Conditionally fetch site transfer details only when ID exists
  const { data: siteTransfer } = useSiteTransfer(siteTransferId ?? 0);

  return {
    employee,
    project,
    organizations,
    leaveRequest,
    task,
    issue,
    chatRoom,
    vendor,
    material,
    indent,
    storageLocation,
    purchaseOrder,
    labour,
    siteTransfer,
  };
}
