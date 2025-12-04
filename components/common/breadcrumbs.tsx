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
  const breadcrumbItems = pathSegments
    .filter((segment) => segment !== 'dashboard')
    .map((segment, index, filteredArray) => {
      // Find the actual index in the original pathSegments
      const actualIndex = pathSegments.indexOf(segment);
      const href = '/' + pathSegments.slice(0, actualIndex + 1).join('/');
      const isLast = index === filteredArray.length - 1;
      const label =
        breadcrumbNameMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      const isNonInteractive = nonInteractiveSegments.has(segment);

      return {
        href,
        label,
        isLast,
        segment, // Keep track of the segment name
        isNonInteractive, // Mark if this should not be clickable
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
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
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
  );
}
