'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useEmployeeRoles } from '@tornotron/echno-core/employee/hooks';
import {
  isAdmin as hasAdminRole,
  isManagerOrAbove as hasManagerRole,
} from '@tornotron/echno-core/employee/types';
import { usePendingApprovalsCount } from '@/hooks/leave/use-leave';
import { handleSignOut } from '@/lib/auth/auth-utils';
import { Badge } from '@/components/shadcn/badge';
import {
  getSidebarItems,
  groupBySection,
  isPathActive,
  resolveSidebarAccess,
  type ResolvedNavItem,
  type Role,
} from '@/nav';
import { ChevronRight, Lock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/shadcn/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/shadcn/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/shadcn/avatar';

// ---------------------------------------------------------------------------
// Role bridge
// ---------------------------------------------------------------------------

/**
 * Collapse the backend's ~48 `OrgRole` values into the coarse tier that
 * `nav/access` evaluates (`admin | manager | employee`).
 *
 * The nav AccessConfig constants (ADMIN_ONLY, MANAGER_AND_ABOVE) are written
 * in terms of tiers, while `Employee.orgRoles` carries job-family roles like
 * SYSTEM_ADMIN or SITE_MANAGER. Without this mapping the two vocabularies
 * never intersect and every gated item reads as locked.
 */
function toNavRole(orgRoles: string[]): Role {
  if (hasAdminRole(orgRoles)) return 'admin';
  if (hasManagerRole(orgRoles)) return 'manager';
  return 'employee';
}

// ---------------------------------------------------------------------------
// Active-path resolution
// ---------------------------------------------------------------------------

function collectPaths(items: ResolvedNavItem[]): string[] {
  return items.flatMap((item) => [item.path, ...collectPaths(item.children)]);
}

/**
 * The single most specific nav path matching the current URL.
 * Longest match wins, so /…/chat never lights up Home as well.
 */
function findActivePath(
  items: ResolvedNavItem[],
  pathname: string
): string | undefined {
  return collectPaths(items)
    .filter((path) => isPathActive(path, pathname))
    .toSorted((a, b) => b.length - a.length)[0];
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  /** Total unread chat messages across all rooms, injected by the app layer. */
  chatUnreadCount?: number;
}

export function AppSidebar({ chatUnreadCount = 0 }: AppSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  const { orgRoles, employee } = useEmployeeRoles();

  // Pending leave approvals drive a badge, and only managers/admins can approve.
  const canApproveLeaves = hasManagerRole(orgRoles as string[]);
  const { data: leavePendingCount } = usePendingApprovalsCount(
    canApproveLeaves ? employee?.id || 0 : 0
  );

  /** Badge counts keyed by nav route id. */
  const badges = useMemo<Record<string, number | undefined>>(
    () => ({
      chat: chatUnreadCount,
      'workforce-leaves': leavePendingCount,
    }),
    [chatUnreadCount, leavePendingCount]
  );

  const sections = useMemo(() => {
    const items = resolveSidebarAccess(getSidebarItems(), {
      role: toNavRole(orgRoles as string[]),
      isAuthenticated: true,
    });
    return groupBySection(items);
  }, [orgRoles]);

  const activePath = useMemo(
    () =>
      findActivePath(
        sections.flatMap((g) => g.items),
        pathname
      ),
    [sections, pathname]
  );

  // Only show sidebar for authenticated users
  if (!session) {
    return null;
  }

  function renderBadge(id: string, className: string) {
    const count = badges[id];
    if (!count || count <= 0) return null;
    return (
      <Badge variant="destructive" className={className}>
        {count > 99 ? '99+' : count}
      </Badge>
    );
  }

  function tooltipFor(item: ResolvedNavItem) {
    if (item.locked) return `${item.label} (Locked)`;
    const count = badges[item.id];
    if (count && count > 0) return `${item.label} (${count})`;
    return item.label;
  }

  function renderItem(item: ResolvedNavItem) {
    const Icon = item.icon;
    const hasChildren = item.children.length > 0;
    const childActive = item.children.some((c) => c.path === activePath);

    // ── Locked ──────────────────────────────────────────────────────────────
    if (item.locked) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            tooltip={tooltipFor(item)}
            className="cursor-not-allowed opacity-60"
            disabled
          >
            {Icon && <Icon className="text-zinc-400" />}
            <span className="text-zinc-500">{item.label}</span>
            {state !== 'collapsed' && (
              <Lock className="ml-auto h-3 w-3 text-zinc-400" />
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // ── Leaf ────────────────────────────────────────────────────────────────
    if (!hasChildren) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            asChild
            isActive={item.path === activePath}
            tooltip={tooltipFor(item)}
          >
            <Link href={item.path} className="relative">
              {Icon && <Icon />}
              <span>{item.label}</span>
              {renderBadge(item.id, 'ml-auto h-5 min-w-5 px-1 text-xs')}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // ── Parent, collapsed rail → flyout dropdown ────────────────────────────
    if (state === 'collapsed') {
      return (
        <SidebarMenuItem key={item.id}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={{ children: tooltipFor(item), side: 'right' }}
                isActive={childActive}
                className="relative"
              >
                {Icon && <Icon />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-52">
              <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <DropdownMenuItem
                    key={child.id}
                    className="flex cursor-pointer items-center gap-2"
                    onSelect={() => router.push(child.path)}
                  >
                    {ChildIcon && <ChildIcon className="h-4 w-4" />}
                    <span>{child.label}</span>
                    {renderBadge(child.id, 'ml-auto h-5 min-w-5 px-1 text-xs')}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      );
    }

    // ── Parent, expanded → collapsible group ────────────────────────────────
    return (
      <Collapsible
        key={item.id}
        defaultOpen={childActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.label} isActive={childActive}>
              {Icon && <Icon />}
              <span>{item.label}</span>
              {renderBadge(item.id, 'mr-2 ml-auto h-5 min-w-5 px-1 text-xs')}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <SidebarMenuSubItem key={child.id}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={child.path === activePath}
                    >
                      <Link href={child.path}>
                        {ChildIcon && <ChildIcon />}
                        <span>{child.label}</span>
                        {renderBadge(
                          child.id,
                          'ml-auto h-5 min-w-5 px-1 text-xs'
                        )}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  const userName = session.user?.name || 'User';
  const initials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('') || 'U';

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
              priority
              style={{ width: 'auto', height: 'auto' }}
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
            style={{ width: 'auto', height: 'auto' }}
            className="dark:invert"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((group) => (
          <SidebarGroup key={group.section.id}>
            <SidebarGroupLabel>{group.section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => renderItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage
                      src={employee?.profilePicture?.file}
                      alt={userName}
                    />
                    <AvatarFallback className="bg-zinc-500 text-xs font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold">{userName}</p>
                    <p className="truncate text-xs opacity-50">
                      {session.user?.email || ''}
                    </p>
                  </div>
                  <ChevronRight className="ml-auto size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                sideOffset={8}
                className="min-w-56"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {userName}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {session.user?.email || ''}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => handleSignOut()}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  );
}
