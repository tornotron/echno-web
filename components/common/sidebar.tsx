'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Module } from '@/types/rbac/module';
import { useModuleAccess, useIsSystemAdmin } from '@/hooks/use-rbac';
import {
  Home,
  Users,
  Calendar,
  FileText,
  UserCheck,
  Mail,
  Handshake,
  HardHat,
  ClipboardList,
  Package,
  Boxes,
  ShoppingCart,
  TrendingUp,
  ArrowLeftRight,
  Warehouse,
  PackageCheck,
  Wallet,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  TrendingDown,
  PiggyBank,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  FolderKanban,
  Shield,
  UserCog,
  Blocks,
  Settings,
  Lock,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RequestAccessModal } from '@/components/access-request';
import { AccessRequestType } from '@/types/access-request';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: Module;
  requiredRoles?: string[]; // Roles required to see this item (empty/undefined = all roles can see)
  hideForRoles?: string[]; // Roles that should NOT see this item
  hideWhenLocked?: boolean; // If true, hide completely instead of showing locked state
  items?: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    module?: Module;
    requiredRoles?: string[]; // Roles required to see this sub-item
  }[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/users/dashboard', icon: Home },
  // ==================== ADMIN SECTION ====================
  // Only visible to system admins
  {
    title: 'Administrator',
    url: '/admin/access-control/users',
    icon: Shield,
    requiredRoles: ['system-admin'],
    hideWhenLocked: true, // Admin section should be hidden for non-admins
    items: [
      {
        title: 'Users',
        url: '/admin/access-control/users',
        icon: Users,
        requiredRoles: ['system-admin'],
      },
      {
        title: 'Roles',
        url: '/admin/access-control/roles',
        icon: UserCog,
        requiredRoles: ['system-admin'],
      },
      {
        title: 'Modules',
        url: '/admin/access-control/modules',
        icon: Blocks,
        requiredRoles: ['system-admin'],
      },
      {
        title: 'Access Requests',
        url: '/admin/access-requests',
        icon: KeyRound,
        requiredRoles: ['system-admin'],
      },
    ],
  },
  // ==================== MY ACCESS REQUESTS ====================
  // Only visible to non-admin users (admins have it in Administrator section)
  {
    title: 'My Access Requests',
    url: '/users/dashboard/access-requests',
    icon: KeyRound,
    hideForRoles: ['system-admin'], // Hide for system admins
  },
  // ==================== PROJECT SECTION ====================
  {
    title: 'Projects',
    url: '/users/dashboard/projects',
    icon: FolderKanban,
    module: Module.PROJECT,
    items: [
      {
        title: 'All Projects',
        url: '/users/dashboard/projects',
        icon: FolderKanban,
      },
      {
        title: 'Inspections',
        url: '/users/dashboard/projects/inspections',
        icon: ClipboardCheck,
      },
    ],
  },
  // ==================== WORKFORCE SECTION ====================
  {
    title: 'Workforce',
    url: '/users/dashboard/workforce',
    icon: Users,
    module: Module.WORKFORCE,
    items: [
      {
        title: 'Employees',
        url: '/users/dashboard/workforce/employees',
        icon: Users,
      },
      {
        title: 'Invitations',
        url: '/users/dashboard/workforce/invitations',
        icon: Mail,
      },
      {
        title: 'Leave Requests',
        url: '/users/dashboard/workforce/leaves',
        icon: Calendar,
      },
    ],
  },
  // ==================== ATTENDANCE SECTION ====================
  {
    title: 'Attendance',
    url: '/users/dashboard/attendance',
    icon: UserCheck,
    module: Module.ATTENDANCE,
    items: [
      {
        title: 'All Attendance',
        url: '/users/dashboard/attendance',
        icon: ClipboardCheck,
      },
      {
        title: 'Mark Attendance',
        url: '/users/dashboard/attendance/mark',
        icon: UserCheck,
      },
    ],
  },
  // ==================== THIRD PARTY SECTION ====================
  {
    title: 'Third Party',
    url: '/users/dashboard/third-party',
    icon: Handshake,
    module: Module.VENDOR,
    items: [
      {
        title: 'Labour',
        url: '/users/dashboard/third-party/labour',
        icon: HardHat,
      },
      {
        title: 'Sub-Contracts',
        url: '/users/dashboard/third-party/sub-contracts',
        icon: ClipboardList,
      },
      {
        title: 'Vendors',
        url: '/users/dashboard/third-party/vendors',
        icon: Package,
      },
    ],
  },
  // ==================== RESOURCES SECTION ====================
  {
    title: 'Resources',
    url: '/users/dashboard/resources',
    icon: Boxes,
    module: Module.INVENTORY,
    items: [
      {
        title: 'Inventory',
        url: '/users/dashboard/resources/inventory',
        icon: Warehouse,
      },
      {
        title: 'Assets',
        url: '/users/dashboard/resources/assets',
        icon: PackageCheck,
      },
      {
        title: 'Locations',
        url: '/users/dashboard/resources/locations',
        icon: MapPin,
      },
      {
        title: 'Purchase Orders',
        url: '/users/dashboard/resources/purchase-orders',
        icon: ShoppingCart,
      },
      {
        title: 'Goods Receipts',
        url: '/users/dashboard/resources/goods-receipts',
        icon: PackageCheck,
      },
      {
        title: 'Material Requests',
        url: '/users/dashboard/resources/material-requests',
        icon: ClipboardList,
      },
      {
        title: 'Transfers',
        url: '/users/dashboard/resources/transfers',
        icon: ArrowLeftRight,
      },
      {
        title: 'Stock Adjustments',
        url: '/users/dashboard/resources/stock-adjustments',
        icon: TrendingUp,
      },
    ],
  },
  // ==================== FINANCE SECTION ====================
  {
    title: 'Finance',
    url: '/users/dashboard/finance',
    icon: Wallet,
    module: Module.FINANCE,
    items: [
      {
        title: 'Receipts',
        url: '/users/dashboard/finance/receipts',
        icon: Receipt,
      },
      {
        title: 'Payments',
        url: '/users/dashboard/finance/payments',
        icon: CreditCard,
      },
      {
        title: 'Invoices',
        url: '/users/dashboard/finance/invoices',
        icon: FileSpreadsheet,
      },
      {
        title: 'Expenses',
        url: '/users/dashboard/finance/expenses',
        icon: TrendingDown,
      },
      {
        title: 'Budgets',
        url: '/users/dashboard/finance/budgets',
        icon: PiggyBank,
      },
    ],
  },
  // ==================== EXTRA SECTIONS (COMMENTED OUT) ====================
  /*
  {
    title: 'Compliance',
    url: '/users/dashboard/compliance',
    icon: ShieldCheck,
    items: [
      {
        title: 'Permits & Licenses',
        url: '/users/dashboard/compliance/permits',
        icon: FileText,
      },
      {
        title: 'Certificates',
        url: '/users/dashboard/compliance/certificates',
        icon: CheckCircle2,
      },
      {
        title: 'Regulations',
        url: '/users/dashboard/compliance/regulations',
        icon: ClipboardList,
      },
      {
        title: 'Audits',
        url: '/users/dashboard/compliance/audits',
        icon: ClipboardCheck,
      },
      {
        title: 'Reports',
        url: '/users/dashboard/compliance/reports',
        icon: FileSpreadsheet,
      },
    ],
  },
  { title: 'Reports', url: '/users/dashboard/reports', icon: BarChart3 },
  { title: 'Documents', url: '/users/dashboard/documents', icon: FileText },
  */
];

// Helper function to check if a path is active
// Returns true if pathname matches exactly or is a sub-route (with /)
function isPathActive(itemUrl: string, currentPath: string) {
  if (currentPath === itemUrl) return true;
  // Check if it's a sub-route (must be followed by /)
  return currentPath.startsWith(itemUrl + '/');
}

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedLockedItem, setSelectedLockedItem] = useState<{
    title: string;
    module?: Module;
  } | null>(null);

  // Handle click on locked item
  const handleLockedItemClick = (item: { title: string; module?: Module }) => {
    setSelectedLockedItem(item);
    setRequestModalOpen(true);
  };

  // Get module access for all modules used in navigation
  const hasProjectAccess = useModuleAccess(Module.PROJECT);
  const hasWorkforceAccess = useModuleAccess(Module.WORKFORCE);
  const hasAttendanceAccess = useModuleAccess(Module.ATTENDANCE);
  const hasVendorAccess = useModuleAccess(Module.VENDOR);
  const hasInventoryAccess = useModuleAccess(Module.INVENTORY);
  const hasFinanceAccess = useModuleAccess(Module.FINANCE);
  const isSystemAdmin = useIsSystemAdmin();

  // Helper to check if user has module access
  const hasModuleAccess = (module?: Module): boolean => {
    if (!module) return true; // No module requirement - always visible

    switch (module) {
      case Module.PROJECT: {
        return hasProjectAccess;
      }
      case Module.WORKFORCE: {
        return hasWorkforceAccess;
      }
      case Module.ATTENDANCE: {
        return hasAttendanceAccess;
      }
      case Module.VENDOR: {
        return hasVendorAccess;
      }
      case Module.INVENTORY: {
        return hasInventoryAccess;
      }
      case Module.FINANCE: {
        return hasFinanceAccess;
      }
      default: {
        return false;
      }
    }
  };

  // Helper to check if user can see item (module access + role check)
  const canSeeItem = (item: {
    module?: Module;
    requiredRoles?: string[];
    hideForRoles?: string[];
  }): boolean => {
    const userRoles = session?.user?.roles || [];

    // Check if item should be hidden for user's roles
    if (item.hideForRoles && item.hideForRoles.length > 0) {
      const shouldHide = item.hideForRoles.some((role) =>
        userRoles.includes(role)
      );
      if (shouldHide) return false;
    }

    // Check role requirement
    // If requiredRoles is undefined or empty, all users can see the item
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      // User must have at least one of the required roles
      const hasRequiredRole = item.requiredRoles.some((role) =>
        userRoles.includes(role)
      );
      if (!hasRequiredRole) return false;
    }
    // Then check module access
    return hasModuleAccess(item.module);
  };

  // Memoize navigation items rendering to prevent flickering
  const navigationItems = useMemo(() => {
    return navItems
      .filter((item) => {
        // If item should be hidden when locked and user doesn't have access, filter it out
        if (item.hideWhenLocked && !canSeeItem(item)) {
          return false;
        }
        return true;
      })
      .map((item) => {
        const hasAccess = canSeeItem(item);
        // Filter child items - show all but mark as locked
        const processedItems = item.items?.map((child) => ({
          ...child,
          hasAccess: canSeeItem(child),
        }));
        // Only show children that user has access to OR show all if parent is locked
        const filteredItems = hasAccess
          ? processedItems?.filter((child) => child.hasAccess)
          : processedItems;
        const hasChildren = filteredItems && filteredItems.length > 0;

        let isChildActive = false;
        let activeChildUrl = '';

        if (hasChildren && filteredItems && hasAccess) {
          // Find the most specific matching child (longest URL that matches)
          const matchingChildren = filteredItems.filter(
            (child) => child.hasAccess && isPathActive(child.url, pathname)
          );

          if (matchingChildren.length > 0) {
            // Sort by URL length (descending) to get the most specific match
            matchingChildren.sort((a, b) => b.url.length - a.url.length);
            activeChildUrl = matchingChildren[0].url;
            isChildActive = true;
          }
        }

        // Parent is only active if current path matches exactly AND no child is active
        const isActive = pathname === item.url && !isChildActive && hasAccess;

        return {
          ...item,
          items: filteredItems,
          hasChildren,
          isChildActive,
          isActive,
          activeChildUrl,
          hasAccess,
          isLocked: !hasAccess,
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathname,
    hasProjectAccess,
    hasWorkforceAccess,
    hasAttendanceAccess,
    hasVendorAccess,
    hasInventoryAccess,
    hasFinanceAccess,
    isSystemAdmin,
    session?.user?.roles,
  ]);

  // Only show sidebar for authenticated users
  if (!session) {
    return null;
  }

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        {/* Expanded state */}
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/e-ai-logo.png"
              alt="Echno Logo"
              width={110}
              height={40}
              className="dark:invert"
            />
          </div>
        </div>
        {/* Collapsed state - centered bigger logo */}
        <div className="relative hidden items-center justify-center py-1 group-data-[collapsible=icon]:flex">
          <Image
            src="/e-logo.png"
            alt="Echno Logo"
            width={40}
            height={40}
            className="dark:invert"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // Locked item without children - show with lock icon
                if (item.isLocked && !item.hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={`${item.title} (Locked)`}
                        className="cursor-pointer opacity-60 hover:opacity-80"
                        onClick={() => handleLockedItemClick(item)}
                      >
                        <item.icon className="text-zinc-400" />
                        <span className="text-zinc-500">{item.title}</span>
                        <Lock className="ml-auto h-3 w-3 text-zinc-400" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                if (!item.hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Locked item with children - show collapsed with lock
                if (item.isLocked && state === 'collapsed') {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={{
                          children: `${item.title} (Locked)`,
                          side: 'right',
                        }}
                        className="cursor-pointer opacity-60 hover:opacity-80"
                        onClick={() => handleLockedItemClick(item)}
                      >
                        <item.icon className="text-zinc-400" />
                        <span className="text-zinc-500">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // When collapsed, show dropdown menu
                if (state === 'collapsed') {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            tooltip={{
                              children: item.title,
                              side: 'right',
                            }}
                            isActive={item.isActive || item.isChildActive}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="w-48"
                        >
                          {item.items?.map((subItem) => (
                            <DropdownMenuItem key={subItem.title} asChild>
                              <Link
                                href={subItem.url}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                // Locked item with children - show expanded with lock
                if (item.isLocked) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={`${item.title} (Locked)`}
                        className="cursor-pointer opacity-60 hover:opacity-80"
                        onClick={() => handleLockedItemClick(item)}
                      >
                        <item.icon className="text-zinc-400" />
                        <span className="text-zinc-500">{item.title}</span>
                        <Lock className="ml-auto h-3 w-3 text-zinc-400" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // When expanded, show collapsible menu
                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={item.isChildActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={item.isActive}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subItem.url === item.activeChildUrl}
                              >
                                <Link href={subItem.url}>
                                  <subItem.icon />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-zinc-400 to-zinc-600">
                <span className="text-sm font-medium text-white">
                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {session.user?.email || ''}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Request Access Modal */}
      {selectedLockedItem && (
        <RequestAccessModal
          open={requestModalOpen}
          onOpenChange={(open) => {
            setRequestModalOpen(open);
            if (!open) setSelectedLockedItem(null);
          }}
          moduleOrResource={
            selectedLockedItem.module || selectedLockedItem.title
          }
          displayName={selectedLockedItem.title}
          description={`Request access to the ${selectedLockedItem.title} module to unlock its features.`}
          requestType={AccessRequestType.MODULE}
        />
      )}
    </SidebarPrimitive>
  );
}
