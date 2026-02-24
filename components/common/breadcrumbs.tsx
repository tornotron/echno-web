'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Employee } from '@/types/employee/employee';
import { LeaveRequest } from '@/types/leave';
import { Organization } from '@/types/organization';
import { Task } from '@/types/task';
import { Issue } from '@/types/issue/issue';
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
// import { ChatRoom, ChatRoomType } from '@/types/chat'; // temporarily disabled – moving chat to separate branch
import {
  breadcrumbNameMap,
  isHiddenSegment,
  isNonInteractiveSegment,
  isIdSegment,
} from '@/lib/utils/navigation-utils';
import {
  getNameForId,
  truncateText,
  applyBreadcrumbOverrides,
  type FallbackNameResolver,
} from '@/lib/utils/breadcrumb-utils';
import { Budget } from '@/types/finance/budget';
import {
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

/**
 * Maps parent URL segments to mock-data lookups.
 * Used as the `fallbackResolver` for `getNameForId` until these modules
 * are backed by real API data.
 */
const mockFallbackResolver: FallbackNameResolver = (
  parentSegment,
  numericId
) => {
  switch (parentSegment) {
    case 'inspections': {
      return mockInspections.find((i) => i.id === numericId)?.title;
    }
    case 'labour': {
      return mockLabour.find((l) => l.id === numericId)?.name;
    }
    case 'assets': {
      return mockAssets.find((a) => a.id === numericId)?.name;
    }
    case 'budgets': {
      return mockBudgets.find((b: Budget) => b.id === numericId)?.budgetNumber;
    }
    case 'locations': {
      return mockLocations.find((l) => l.id === numericId)?.name;
    }
    case 'purchase-orders': {
      return mockPurchaseOrders.find((p) => p.id === numericId)?.poNumber;
    }
    case 'material-requests': {
      return mockMaterialRequests.find((m) => m.id === numericId)
        ?.requestNumber;
    }
    case 'transfers': {
      return mockTransfers.find((t) => t.id === numericId)?.transferNumber;
    }
    case 'stock-adjustments': {
      return mockStockAdjustments.find((s) => s.id === numericId)
        ?.adjustmentNumber;
    }
    case 'goods-receipts': {
      return mockGoodsReceipts.find((g) => g.id === numericId)?.receiptNumber;
    }
    case 'receipts': {
      return mockReceipts.find((r) => r.id === numericId)?.receiptNumber;
    }
    case 'payments': {
      return mockPayments.find((p) => p.id === numericId)?.paymentNumber;
    }
    case 'invoices': {
      return mockInvoices.find((i) => i.id === numericId)?.invoiceNumber;
    }
    case 'expenses': {
      return mockExpenses.find((e) => e.id === numericId)?.expenseNumber;
    }
    default: {
      return;
    }
  }
};

interface BreadcrumbsProps {
  employees?: Employee[];
  projects?: Project[];
  organizations?: Organization[];
  leaveRequest?: LeaveRequest;
  task?: Task;
  issue?: Issue;
  // chatRoom?: ChatRoom; // temporarily disabled – moving chat to separate branch
}

// temporarily disabled – moving chat to separate branch
// /** Derive a human-readable display name for a chat room. */
// function getChatRoomName(room: ChatRoom): string {
//   if (room.name) return room.name;
//   if (room.type === ChatRoomType.ai) return 'AI Assistant';
//   if (room.type === ChatRoomType.direct) {
//     const names = (room.participants ?? [])
//       .map((p) => p.employee?.name)
//       .filter(Boolean)
//       .join(', ');
//     return names || `Room ${room.id}`;
//   }
//   return `Room ${room.id}`;
// }

export function Breadcrumbs({
  employees,
  projects,
  organizations,
  leaveRequest,
  task,
  issue,
  // chatRoom, // temporarily disabled – moving chat to separate branch
}: BreadcrumbsProps) {
  // const chatRoomName = undefined; // temporarily disabled – moving chat to separate branch
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const filteredSegments = pathSegments.filter((segment) => {
    // Hide standard segments
    if (isHiddenSegment(segment)) return false;

    return true;
  });

  const breadcrumbItems = filteredSegments
    .map((segment, index) => {
      const actualIndex = pathSegments.findIndex((seg, idx) => {
        const visibleUpToNow = pathSegments.slice(0, idx + 1).filter((s) => {
          // Hide standard segments
          if (isHiddenSegment(s)) return false;

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
            projects,
            task,
            issue,
            // chatRoomName // temporarily disabled – moving chat to separate branch
            mockFallbackResolver
          )
        : (breadcrumbNameMap[segment] ??
          segment.charAt(0).toUpperCase() + segment.slice(1));

      const label = truncateText(fullName);

      return {
        href,
        label,
        fullName,
        isLast,
        isNonInteractive: isNonInteractiveSegment(segment),
        isTruncated: label !== fullName,
      };
    })
    .filter(
      (item, index, arr) =>
        index === 0 ||
        arr[index - 1].label.toLowerCase() !== item.label.toLowerCase()
    );

  // Apply contextual breadcrumb overrides (leave detail, issue-from-task, etc.)
  applyBreadcrumbOverrides(breadcrumbItems, pathname, searchParams, task);

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
          {breadcrumbItems.map((item) => (
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
