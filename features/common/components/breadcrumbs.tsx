'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Employee } from '@tornotron/echno-core/employee/types';
import { LeaveRequest } from '@/types/leave';
import { Organization } from '@tornotron/echno-core/organization/types';
import { Task } from '@tornotron/echno-core/task/types';
import { Issue } from '@tornotron/echno-core/issue/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/shadcn/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { Project } from '@tornotron/echno-core/project/types';
import { ChatRoom, ChatRoomType } from '@/types/chat';
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
import { Vendor } from '@tornotron/echno-core/vendor/types';
import { Material } from '@tornotron/echno-core/materials/types';
import { Indent } from '@tornotron/echno-core/indents/types';
import { StorageLocation } from '@tornotron/echno-core/storage-locations/types';
import { Labour } from '@tornotron/echno-core/labour/types';
import { PurchaseOrder } from '@tornotron/echno-core/purchase-orders/types';
import { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';
import {
  mockAssets,
  mockBudgets,
  mockStockAdjustments,
  mockGoodsReceipts,
  mockReceipts,
  mockExpenses,
} from '@/components/shared/mock-data';
import { routes } from '@/nav';

const mockFallbackResolver: FallbackNameResolver = (
  parentSegment,
  numericId
) => {
  switch (parentSegment) {
    case 'assets': {
      return mockAssets.find((a) => a.id === numericId)?.name;
    }
    case 'budgets': {
      return mockBudgets.find((b: Budget) => b.id === numericId)?.budgetNumber;
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
  chatRoom?: ChatRoom;
  vendor?: Vendor;
  material?: Material;
  indent?: Indent;
  storageLocation?: StorageLocation;
  purchaseOrder?: PurchaseOrder;
  labour?: Labour;
  siteTransfer?: SiteTransfer;
}

function getChatRoomName(room: ChatRoom): string {
  if (room.name) return room.name;
  if (room.type === ChatRoomType.ai) return 'AI Assistant';
  if (room.type === ChatRoomType.direct) {
    const names = (room.participants ?? [])
      .map((p) => p.employee?.name)
      .filter(Boolean)
      .join(', ');
    return names || `Room ${room.id}`;
  }
  return `Room ${room.id}`;
}

export function Breadcrumbs({
  employees,
  projects,
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
}: BreadcrumbsProps) {
  const chatRoomName = chatRoom ? getChatRoomName(chatRoom) : undefined;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const leaveRequests = leaveRequest ? [leaveRequest] : undefined;

  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathname === routes.href) {
    return (
      <Breadcrumb className="text-base">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const filteredSegments = pathSegments.filter((segment) => {
    if (isHiddenSegment(segment)) return false;
    return true;
  });

  const breadcrumbItems = filteredSegments
    .map((segment, index) => {
      const actualIndex = pathSegments.findIndex((seg, idx) => {
        const visibleUpToNow = pathSegments.slice(0, idx + 1).filter((s) => {
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
            chatRoomName,
            mockFallbackResolver,
            vendor,
            material,
            indent,
            storageLocation,
            purchaseOrder,
            labour,
            siteTransfer
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

  applyBreadcrumbOverrides(breadcrumbItems, pathname, searchParams, task);

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
        <BreadcrumbList className="flex flex-wrap gap-1 sm:gap-1.5">
          {/* Dashboard home — always visible on sm+ */}
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild>
              <Link href={routes.href}>Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Mobile: collapsed items in dropdown */}
          {shouldCollapse && (
            <>
              <BreadcrumbSeparator className="hidden sm:block md:hidden" />
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

          {/* Desktop: show all items */}
          {breadcrumbItems.map((item) => (
            <div
              key={item.href}
              className="hidden md:inline-flex md:items-center md:gap-1.5"
            >
              <BreadcrumbSeparator />
              <BreadcrumbItem>{renderBreadcrumbItem(item)}</BreadcrumbItem>
            </div>
          ))}

          {/* Tablet/mobile: collapsed view */}
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
