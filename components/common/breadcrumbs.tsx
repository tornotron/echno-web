'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Budget } from '@/types/finance/budget';
import { Employee } from '@/types/employee/employee';
import { useEmployees } from '@/hooks/employee/use-employee';
import { useProjects } from '@/hooks/project/use-projects';
import { useLeaveRequest } from '@/hooks/leave/use-leave';
import { useOrganizations } from '@/hooks/organization/use-organizations';
import { LeaveRequest } from '@/types/leave';
import { Organization } from '@/types/organization';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/types/project/project';
import {
  mockTasks,
  mockIssues,
  mockInspections,
  mockLabour,
  mockAssets,
  mockBudgets,
  mockLocations,
  mockPurchaseOrders,
  mockMaterialRequests,
  mockTransfers,
  mockStockAdjustments,
  mockGoodsReceipts,
  mockReceipts,
  mockPayments,
  mockInvoices,
  mockExpenses,
} from '@/components/shared/mock-data';

interface BreadcrumbConfig {
  [key: string]: string;
}

// Map of route segments to display names
const breadcrumbNameMap: BreadcrumbConfig = {
  dashboard: 'Dashboard',
  profile: 'Profile',
  login: 'Login',
  settings: 'Settings',
  admin: 'Administrator',
  employees: 'Employees',
  organizations: 'Organizations',
  tasks: 'Tasks',
  issues: 'Issues',
  attendance: 'Attendance',
  leaves: 'Leave Management',
  'leave-requests': 'Leave Requests',
  requests: 'My Requests',
  apply: 'Apply for Leave',
  calendar: 'Leave Calendar',
  balance: 'Leave Balance',
  policies: 'Leave Policies',
  approvals: 'LeaveApprovals',
  'organization-requests': 'Organization Requests',

  inspections: 'Inspections',
  new: 'New',
  edit: 'Edit',
  workforce: 'Workforce',
  'third-party': 'Third Party',
  'sub-contracts': 'Sub-Contracts',
  labour: 'Labour',
  vendors: 'Vendors',
  resources: 'Resources',
  inventory: 'Inventory',
  locations: 'Locations',
  'purchase-orders': 'Purchase Orders',
  'material-requests': 'Material Requests',
  'stock-adjustments': 'Stock Adjustments',
  transfers: 'Transfers',
  'goods-receipts': 'Goods Receipts',
  finance: 'Finance',
  receipts: 'Receipts',
  payments: 'Payments',
  invoices: 'Invoices',
  expenses: 'Expenses',
  budgets: 'Budgets',
};

// Segments that should NEVER appear in breadcrumbs
const hiddenSegments = new Set(['users', 'dashboard']);

// Segments that should appear but not be clickable
const nonInteractiveSegments = new Set([
  'workforce',
  'third-party',
  'resources',
]);

// Helper function to check if a string is likely an ID
function isIdSegment(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment
    )
  );
}

// Helper function to get the name for an ID based on context
function getNameForId(
  id: string,
  context: string[],
  employees?: Employee[],
  leaveRequests?: LeaveRequest[],
  organizations?: Organization[],
  projects?: Project[]
): string {
  const numericId = Number.parseInt(id, 10);
  const parentSegment = context.at(-1);

  if (parentSegment === 'projects') {
    return (
      projects?.find((p) => p.id === numericId)?.projectName ?? `Project ${id}`
    );
  }
  if (parentSegment === 'tasks') {
    return mockTasks.find((t) => t.id === numericId)?.title ?? id;
  }
  if (parentSegment === 'issues') {
    return mockIssues.find((i) => i.id === numericId)?.title ?? id;
  }
  if (parentSegment === 'employees' || parentSegment === 'attendance') {
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
  if (parentSegment === 'inspections') {
    return mockInspections.find((i) => i.id === numericId)?.title ?? id;
  }
  if (parentSegment === 'labour') {
    return mockLabour.find((l) => l.id === numericId)?.name ?? id;
  }
  if (parentSegment === 'assets') {
    return mockAssets.find((a) => a.id === numericId)?.name ?? id;
  }
  if (parentSegment === 'budgets') {
    return (
      mockBudgets.find((b: Budget) => b.id === numericId)?.budgetNumber ?? id
    );
  }
  if (parentSegment === 'locations') {
    return mockLocations.find((l) => l.id === numericId)?.name ?? id;
  }
  if (parentSegment === 'purchase-orders') {
    return mockPurchaseOrders.find((p) => p.id === numericId)?.poNumber ?? id;
  }
  if (parentSegment === 'material-requests') {
    return (
      mockMaterialRequests.find((m) => m.id === numericId)?.requestNumber ?? id
    );
  }
  if (parentSegment === 'transfers') {
    return mockTransfers.find((t) => t.id === numericId)?.transferNumber ?? id;
  }
  if (parentSegment === 'stock-adjustments') {
    return (
      mockStockAdjustments.find((s) => s.id === numericId)?.adjustmentNumber ??
      id
    );
  }
  if (parentSegment === 'goods-receipts') {
    return (
      mockGoodsReceipts.find((g) => g.id === numericId)?.receiptNumber ?? id
    );
  }
  if (parentSegment === 'receipts') {
    return mockReceipts.find((r) => r.id === numericId)?.receiptNumber ?? id;
  }
  if (parentSegment === 'payments') {
    return mockPayments.find((p) => p.id === numericId)?.paymentNumber ?? id;
  }
  if (parentSegment === 'invoices') {
    return mockInvoices.find((i) => i.id === numericId)?.invoiceNumber ?? id;
  }
  if (parentSegment === 'expenses') {
    return mockExpenses.find((e) => e.id === numericId)?.expenseNumber ?? id;
  }

  return id;
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number = 30): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
}

// Map of `from` query param values to breadcrumb overrides for leave request details
const leaveFromMap: Record<string, { label: string; href: string }> = {
  'my-requests': {
    label: 'My Requests',
    href: '/users/dashboard/workforce/leaves/requests',
  },
  'org-requests': {
    label: 'Organization Requests',
    href: '/users/dashboard/workforce/leaves/organization-requests',
  },
  approvals: {
    label: 'Pending Approvals',
    href: '/users/dashboard/workforce/leaves/approvals',
  },
  'employee-dashboard': {
    label: 'Leave Management',
    href: '/users/dashboard/workforce/leaves',
  },
  'manager-dashboard': {
    label: 'Leave Management',
    href: '/users/dashboard/workforce/leaves',
  },
  'admin-dashboard': {
    label: 'Leave Management',
    href: '/users/dashboard/workforce/leaves',
  },
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: employees } = useEmployees();
  const { data: projects } = useProjects();
  const { data: organizations } = useOrganizations();

  // Extract leave request ID from path if present
  const leaveRequestIdMatch = pathname.match(/\/leaves\/requests\/(\d+)/);
  const leaveRequestId = leaveRequestIdMatch
    ? Number.parseInt(leaveRequestIdMatch[1], 10)
    : undefined;
  const { data: leaveRequest } = useLeaveRequest(
    leaveRequestId ?? 0,
    !!leaveRequestId
  );

  // Convert single leave request to array for consistency with getNameForId signature
  const leaveRequests = leaveRequest ? [leaveRequest] : undefined;

  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathname === '/users/dashboard') {
    return (
      <Breadcrumb className="text-base">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const filteredSegments = pathSegments.filter((segment, index) => {
    // Hide standard segments
    if (hiddenSegments.has(segment)) return false;

    return true;
  });

  const breadcrumbItems = filteredSegments
    .map((segment, index) => {
      const actualIndex = pathSegments.findIndex((seg, idx) => {
        const visibleUpToNow = pathSegments.slice(0, idx + 1).filter((s) => {
          // Hide standard segments
          if (hiddenSegments.has(s)) return false;

          return true;
        }).length;
        return seg === segment && visibleUpToNow === index + 1;
      });

      const href = '/' + pathSegments.slice(0, actualIndex + 1).join('/');
      const isLast = index === filteredSegments.length - 1;
      const context = pathSegments.slice(0, actualIndex);

      const fullName = isIdSegment(segment)
        ? getNameForId(
            segment,
            context,
            employees,
            leaveRequests,
            organizations,
            projects
          )
        : (breadcrumbNameMap[segment] ??
          segment.charAt(0).toUpperCase() + segment.slice(1));

      const label = truncateText(fullName);

      return {
        href,
        label,
        fullName,
        isLast,
        isNonInteractive: nonInteractiveSegments.has(segment),
        isTruncated: label !== fullName,
      };
    })
    .filter(
      (item, index, arr) =>
        index === 0 ||
        arr[index - 1].label.toLowerCase() !== item.label.toLowerCase()
    );

  // Override the "My Requests" breadcrumb on leave request detail pages based on `from` param
  const fromParam = searchParams.get('from');
  const isLeaveRequestDetail = pathname.match(
    /\/workforce\/leaves\/requests\/\d+$/
  );
  if (isLeaveRequestDetail && fromParam && leaveFromMap[fromParam]) {
    const override = leaveFromMap[fromParam];
    const requestsIndex = breadcrumbItems.findIndex(
      (item) => item.label === 'Requests' || item.label === 'My Requests'
    );
    if (requestsIndex !== -1) {
      if (override.label === 'Leave Management') {
        // From a dashboard — remove the "My Requests" breadcrumb since
        // "Leave Management" is already shown from the `leaves` segment
        breadcrumbItems.splice(requestsIndex, 1);
        // Recalculate isLast after removal
        for (const [i, item] of breadcrumbItems.entries()) {
          item.isLast = i === breadcrumbItems.length - 1;
        }
      } else {
        // From a different list page — override the label and href
        breadcrumbItems[requestsIndex] = {
          ...breadcrumbItems[requestsIndex],
          label: override.label,
          fullName: override.label,
          href: override.href,
          isTruncated: false,
        };
      }
    }
  }

  // Override "Apply for Leave" breadcrumb when editing a leave request
  const isLeaveApplyPage = pathname.endsWith('/workforce/leaves/apply');
  const editParam = searchParams.get('edit');
  if (isLeaveApplyPage && editParam) {
    const applyIndex = breadcrumbItems.findIndex(
      (item) => item.label === 'Apply for Leave'
    );
    if (applyIndex !== -1) {
      breadcrumbItems[applyIndex] = {
        ...breadcrumbItems[applyIndex],
        label: 'Edit Leave Request',
        fullName: 'Edit Leave Request',
        isTruncated: false,
      };
    }
  }

  // For mobile: show first item, ellipsis dropdown for middle items, and last 2 items
  const ITEMS_TO_SHOW_ON_MOBILE = 2;
  const shouldCollapse = breadcrumbItems.length > ITEMS_TO_SHOW_ON_MOBILE;
  const collapsedItems = shouldCollapse
    ? breadcrumbItems.slice(0, -ITEMS_TO_SHOW_ON_MOBILE)
    : [];
  const visibleItemsOnMobile = shouldCollapse
    ? breadcrumbItems.slice(-ITEMS_TO_SHOW_ON_MOBILE)
    : breadcrumbItems;

  const renderBreadcrumbItem = (item: (typeof breadcrumbItems)[0]) => {
    if (item.isLast || item.isNonInteractive) {
      return item.isTruncated ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <BreadcrumbPage className="max-w-[120px] cursor-default truncate sm:max-w-[200px] md:max-w-none">
              {item.label}
            </BreadcrumbPage>
          </TooltipTrigger>
          <TooltipContent>{item.fullName}</TooltipContent>
        </Tooltip>
      ) : (
        <BreadcrumbPage className="max-w-[120px] truncate sm:max-w-[200px] md:max-w-none">
          {item.label}
        </BreadcrumbPage>
      );
    }

    return item.isTruncated ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <BreadcrumbLink asChild>
            <Link
              href={item.href}
              className="max-w-[120px] truncate sm:max-w-[200px] md:max-w-none"
            >
              {item.label}
            </Link>
          </BreadcrumbLink>
        </TooltipTrigger>
        <TooltipContent>{item.fullName}</TooltipContent>
      </Tooltip>
    ) : (
      <BreadcrumbLink asChild>
        <Link
          href={item.href}
          className="max-w-[120px] truncate sm:max-w-[200px] md:max-w-none"
        >
          {item.label}
        </Link>
      </BreadcrumbLink>
    );
  };

  return (
    <TooltipProvider>
      <Breadcrumb className="text-sm sm:text-base">
        <BreadcrumbList className="flex-wrap gap-1 sm:gap-1.5">
          {/* Dashboard - Always visible */}
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild>
              <Link href="/users/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Mobile: Collapsed items in dropdown */}
          {shouldCollapse && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="hidden sm:inline-flex md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                    <span className="sr-only">Show more breadcrumbs</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {collapsedItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>{item.fullName}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}

          {/* Desktop: Show all items */}
          {breadcrumbItems.map((item, index) => (
            <div
              key={item.href}
              className="hidden md:flex md:items-center md:gap-1.5"
            >
              <BreadcrumbSeparator />
              <BreadcrumbItem>{renderBreadcrumbItem(item)}</BreadcrumbItem>
            </div>
          ))}

          {/* Tablet/Mobile: Show collapsed view */}
          {visibleItemsOnMobile.map((item, index) => (
            <div
              key={item.href}
              className="flex items-center gap-1 sm:gap-1.5 md:hidden"
            >
              <BreadcrumbSeparator
                className={
                  index === 0 && !shouldCollapse ? 'hidden sm:block' : ''
                }
              />
              <BreadcrumbItem>{renderBreadcrumbItem(item)}</BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </TooltipProvider>
  );
}
