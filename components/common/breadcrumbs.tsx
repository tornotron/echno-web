'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  mockTasks,
  mockIssues,
  mockMembers,
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
  users: 'Users',
  admin: 'Admin',
  employees: 'Employees',
  organizations: 'Organizations',
  tasks: 'Tasks',
  issues: 'Issues',
  attendance: 'Attendance',
  leaves: 'Leave Requests',
  'time-tracking': 'Time Tracking',
  new: 'New',
  edit: 'Edit',
  workforce: 'Workforce',
  workflow: 'Workflow',
  'third-party': 'Third Party',
  'sub-contracts': 'Sub-Contracts',
  labour: 'Labour',
  vendors: 'Vendors',
  resources: 'Resources',
  inventory: 'Inventory',
  locations: 'Locations',
};

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
  allSegments: string[]
): string {
  const numericId = Number.parseInt(id, 10);

  // Get the immediate parent segment (the segment right before the ID)
  const parentSegment = context.at(-1);

  // Determine the entity type based on the immediate parent
  if (parentSegment === 'projects') {
    const project = mockProjects.find((p) => p.id === numericId);
    if (project) return project.projectName;
  }

  if (parentSegment === 'tasks') {
    const task = mockTasks.find((t) => t.id === numericId);
    if (task) return task.title;
  }

  if (parentSegment === 'issues') {
    const issue = mockIssues.find((i) => i.id === numericId);
    if (issue) return issue.title;
  }

  if (parentSegment === 'employees') {
    const employee = mockMembers.find((m) => m.id === numericId);
    if (employee) return employee.memberName || 'Employee';
  }

  // Default fallback
  return id;
}

// Helper function to truncate text with ellipsis
function truncateText(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, Math.max(0, maxLength)) + '...';
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page or login page
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  // If we're on dashboard, show just "Dashboard"
  if (pathname === '/dashboard') {
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

  // Segments that should not be clickable (category segments without their own pages)
  const nonInteractiveSegments = new Set([
    'workforce',
    'workflow',
    'third-party',
    'resources',
  ]);

  // Build breadcrumb items, excluding "dashboard" since we add it separately
  const filteredSegments = pathSegments.filter(
    (segment) => segment !== 'dashboard'
  );

  const breadcrumbItems = filteredSegments
    .map((segment, index) => {
      // Calculate the actual position in the original pathSegments array
      // We need to account for the 'dashboard' segment that was filtered out
      const actualIndex = pathSegments.findIndex((seg, idx) => {
        // Count how many segments we've seen up to this point in filtered array
        const filteredUpToNow = pathSegments
          .slice(0, idx + 1)
          .filter((s) => s !== 'dashboard').length;
        return seg === segment && filteredUpToNow === index + 1;
      });

      const href = '/' + pathSegments.slice(0, actualIndex + 1).join('/');
      const isLast = index === filteredSegments.length - 1;

      // Get context (all segments before this one in the original path)
      const context = pathSegments.slice(0, actualIndex);

      // Determine the label
      let label: string;
      let fullName: string;
      if (isIdSegment(segment)) {
        // If it's an ID, get the actual name
        fullName = getNameForId(segment, context, pathSegments);
        label = truncateText(fullName);
      } else {
        // Use the mapping or capitalize
        fullName =
          breadcrumbNameMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1);
        label = fullName;
      }

      const isNonInteractive = nonInteractiveSegments.has(segment);
      const isTruncated = label !== fullName;

      return {
        href,
        label,
        fullName,
        isLast,
        segment, // Keep track of the segment name
        isNonInteractive, // Mark if this should not be clickable
        isTruncated, // Mark if the label is truncated
      };
    })
    // Remove consecutive duplicates (e.g., if both "workforce" segment and "Workforce" label exist)
    .filter((item, index, array) => {
      if (index === 0) return true;
      const prevLabel = array[index - 1].label.toLowerCase();
      const currLabel = item.label.toLowerCase();
      return prevLabel !== currLabel;
    });

  return (
    <TooltipProvider>
      <Breadcrumb className="text-base">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbItems.map((item) => (
            <div key={item.href} className="flex items-center gap-1.5">
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
                      <TooltipContent>
                        <p>{item.fullName}</p>
                      </TooltipContent>
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
                    <TooltipContent>
                      <p>{item.fullName}</p>
                    </TooltipContent>
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
