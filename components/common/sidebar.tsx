'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useEmployeeRoles } from '@/hooks/employee/use-employee-roles';
import { isManagerOrAbove } from '@/types/employee';
import { usePendingApprovalsCount } from '@/hooks/leave/use-leave';
import { Badge } from '@/components/ui/badge';
import {
  getSidebarItems,
  isPathActive,
  type NavItem as CentralNavItem,
} from '@/lib/utils/navigation-utils';
import { ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ---------------------------------------------------------------------------
// Sidebar NavItem — local shape consumed by the sidebar rendering logic.
// Derived from the centralized CentralNavItem at runtime via `toSidebarItem`.
// ---------------------------------------------------------------------------

interface SidebarNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[];
  hideForRoles?: string[];
  hideWhenLocked?: boolean;
  items?: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredRoles?: string[];
  }[];
}

/**
 * Convert a centralized NavItem into the local SidebarNavItem shape.
 * Recursively maps children → items.
 */
function toSidebarItem(item: CentralNavItem): SidebarNavItem {
  // Lucide icons satisfy React.ComponentType<{ className?: string }>
  const Icon = item.icon as
    | React.ComponentType<{ className?: string }>
    | undefined;
  return {
    title: item.label,
    url: item.path,
    // Provide a transparent fallback so the sidebar never receives `undefined` as icon
    icon: Icon ?? ((() => null) as React.ComponentType<{ className?: string }>),
    requiredRoles: item.roles,
    hideForRoles: item.hideForRoles,
    hideWhenLocked: item.hideWhenLocked,
    items: item.children?.map((child) => ({
      title: child.label,
      url: child.path,
      icon:
        (child.icon as React.ComponentType<{ className?: string }>) ??
        ((() => null) as React.ComponentType<{ className?: string }>),
      requiredRoles: child.roles,
    })),
  };
}

/** Sidebar items derived from the centralized navigation config. */
const navItems: SidebarNavItem[] = getSidebarItems().map((item) =>
  toSidebarItem(item)
);

interface AppSidebarProps {
  /** Total unread chat messages across all rooms, injected by the app layer. */
  chatUnreadCount?: number;
}

export function AppSidebar({ chatUnreadCount = 0 }: AppSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  // Get employee roles for authorization checks
  const { orgRoles, employee } = useEmployeeRoles();

  // Get leave management pending approvals count for badge (only for managers/admins)
  const canApproveLeaves = isManagerOrAbove(orgRoles);
  const { data: leavePendingCount } = usePendingApprovalsCount(
    canApproveLeaves ? employee?.id || 0 : 0
  );

  // Helper to check if user can see item (module access + role check)
  const canSeeItem = (item: {
    requiredRoles?: string[];
    hideForRoles?: string[];
  }): boolean => {
    // Check if item should be hidden for user's roles
    if (item.hideForRoles && item.hideForRoles.length > 0) {
      const shouldHide = item.hideForRoles.some((role) =>
        (orgRoles as string[]).includes(role)
      );
      if (shouldHide) return false;
    }

    // Check role requirement
    // If requiredRoles is undefined or empty, all users can see the item
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      // User must have at least one of the required roles
      const hasRequiredRole = item.requiredRoles.some((role) =>
        (orgRoles as string[]).includes(role)
      );
      if (!hasRequiredRole) return false;
    }
    return true;
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

        // For items without children, use prefix matching so sub-routes
        // still highlight the parent — but only when
        // no *other* nav item has a longer, more specific URL that also
        // matches (prevents Dashboard from highlighting when on Chat).
        let isActive = false;
        if (hasAccess && !isChildActive) {
          if (hasChildren) {
            isActive = pathname === item.url;
          } else if (isPathActive(item.url, pathname)) {
            // Check that no sibling nav item has a more specific match
            const moreSpecificSibling = navItems.some(
              (other) =>
                other.url !== item.url &&
                other.url.length > item.url.length &&
                isPathActive(other.url, pathname)
            );
            isActive = !moreSpecificSibling;
          }
        }

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
  }, [pathname, orgRoles]);

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
                        className="cursor-not-allowed opacity-60"
                        disabled
                      >
                        <item.icon className="text-zinc-400" />
                        <span className="text-zinc-500">{item.title}</span>
                        <Lock className="ml-auto h-3 w-3 text-zinc-400" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                if (!item.hasChildren) {
                  const isChat = item.title === 'Chat';
                  const showChatBadge = isChat && chatUnreadCount > 0;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.isActive}
                        tooltip={
                          showChatBadge
                            ? `${item.title} (${chatUnreadCount} unread)`
                            : item.title
                        }
                      >
                        <Link href={item.url} className="relative">
                          <item.icon />
                          <span>{item.title}</span>
                          {showChatBadge && (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-5 min-w-5 px-1 text-xs"
                            >
                              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </Badge>
                          )}
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
                        className="cursor-not-allowed opacity-60"
                        disabled
                      >
                        <item.icon className="text-zinc-400" />
                        <span className="text-zinc-500">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // When collapsed, show dropdown menu
                if (state === 'collapsed') {
                  // Check if this is Leave Management item to show badge in tooltip
                  const isLeaveManagement = item.title === 'Leave Management';
                  const tooltipText =
                    isLeaveManagement &&
                    leavePendingCount &&
                    leavePendingCount > 0
                      ? `${item.title} (${leavePendingCount} pending)`
                      : item.title;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            tooltip={{
                              children: tooltipText,
                              side: 'right',
                            }}
                            isActive={item.isActive || item.isChildActive}
                            className="relative"
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            {isLeaveManagement &&
                              leavePendingCount &&
                              leavePendingCount > 0 && (
                                <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                                  {leavePendingCount > 9
                                    ? '9+'
                                    : leavePendingCount}
                                </span>
                              )}
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="w-48"
                        >
                          {item.items?.map((subItem) => (
                            <DropdownMenuItem
                              key={subItem.title}
                              className="flex cursor-pointer items-center gap-2"
                              onSelect={() => router.push(subItem.url)}
                            >
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
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
                        className="cursor-not-allowed opacity-60"
                        disabled
                      >
                        <item.icon className="text-zinc-400" />
                        <span className="text-zinc-500">{item.title}</span>
                        <Lock className="ml-auto h-3 w-3 text-zinc-400" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // When expanded, show collapsible menu
                // Check if this is Leave Management item to show badge
                const isLeaveManagement = item.title === 'Leave Management';
                const showBadge =
                  isLeaveManagement &&
                  leavePendingCount &&
                  leavePendingCount > 0;

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
                          {showBadge && (
                            <Badge
                              variant="destructive"
                              className="mr-2 ml-auto h-5 min-w-5 px-1 text-xs"
                            >
                              {leavePendingCount}
                            </Badge>
                          )}
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
              <Avatar className="size-8">
                <AvatarImage
                  src={employee?.profilePicture?.file}
                  alt={session.user?.name || 'User'}
                />
                <AvatarFallback className="bg-zinc-500 text-sm font-medium text-white">
                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
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
    </SidebarPrimitive>
  );
}
