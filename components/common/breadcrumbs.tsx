'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Budget } from '@/types/finance/budget';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  mockProjects,
  mockEstimates,
  mockTasks,
  mockIssues,
  mockMembers,
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
  admin: 'Admin',
  employees: 'Employees',
  organizations: 'Organizations',
  tasks: 'Tasks',
  issues: 'Issues',
  attendance: 'Attendance',
  leaves: 'Leave Requests',
  'time-tracking': 'Time Tracking',
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
function getNameForId(id: string, context: string[]): string {
  const numericId = Number.parseInt(id, 10);
  const parentSegment = context.at(-1);

  if (parentSegment === 'projects') {
    return mockProjects.find((p) => p.id === numericId)?.projectName ?? id;
  }
  if (parentSegment === 'tasks') {
    return mockTasks.find((t) => t.id === numericId)?.title ?? id;
  }
  if (parentSegment === 'issues') {
    return mockIssues.find((i) => i.id === numericId)?.title ?? id;
  }
  if (parentSegment === 'employees' || parentSegment === 'attendance') {
    return (
      mockMembers.find((m) => m.id === numericId)?.memberName ?? 'Employee'
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
  if (parentSegment === 'estimates') {
    return mockEstimates.find((e) => e.id === numericId)?.estimateNumber ?? id;
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

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login') return null;

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

  const filteredSegments = pathSegments.filter(
    (segment) => !hiddenSegments.has(segment)
  );

  const breadcrumbItems = filteredSegments
    .map((segment, index) => {
      const actualIndex = pathSegments.findIndex((seg, idx) => {
        const visibleUpToNow = pathSegments
          .slice(0, idx + 1)
          .filter((s) => !hiddenSegments.has(s)).length;
        return seg === segment && visibleUpToNow === index + 1;
      });

      const href = '/' + pathSegments.slice(0, actualIndex + 1).join('/');
      const isLast = index === filteredSegments.length - 1;
      const context = pathSegments.slice(0, actualIndex);

      const fullName = isIdSegment(segment)
        ? getNameForId(segment, context)
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

  return (
    <TooltipProvider>
      <Breadcrumb className="text-base">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/users/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbItems.map((item) => (
            <div key={item.href} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.isLast || item.isNonInteractive ? (
                  item.isTruncated ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <BreadcrumbPage className="cursor-default">
                          {item.label}
                        </BreadcrumbPage>
                      </TooltipTrigger>
                      <TooltipContent>{item.fullName}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )
                ) : item.isTruncated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    </TooltipTrigger>
                    <TooltipContent>{item.fullName}</TooltipContent>
                  </Tooltip>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </TooltipProvider>
  );
}
