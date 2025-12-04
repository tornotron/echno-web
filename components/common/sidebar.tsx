'use client';

import { useSession } from 'next-auth/react';
import {
  Home,
  Users,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  UserCheck,
  Building,
  ListTodo,
  AlertCircle,
  Workflow,
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
  LucideIcon,
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

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Organizations', url: '/dashboard/organizations', icon: Building },
  {
    title: 'Workforce',
    url: '/dashboard/workforce',
    icon: Users,
    items: [
      {
        title: 'Employees',
        url: '/dashboard/workforce/employees',
        icon: Users,
      },
      {
        title: 'Invitations',
        url: '/dashboard/workforce/invitations',
        icon: Mail,
      },
      {
        title: 'Attendance',
        url: '/dashboard/workforce/attendance',
        icon: UserCheck,
      },
      {
        title: 'Leave Requests',
        url: '/dashboard/workforce/leaves',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Workflow',
    url: '/dashboard/workflow',
    icon: Workflow,
    items: [
      { title: 'Tasks', url: '/dashboard/workflow/tasks', icon: ListTodo },
      { title: 'Issues', url: '/dashboard/workflow/issues', icon: AlertCircle },
    ],
  },
  {
    title: 'Third Party',
    url: '/dashboard/third-party',
    icon: Handshake,
    items: [
      { title: 'Labour', url: '/dashboard/third-party/labour', icon: HardHat },
      {
        title: 'Sub-Contracts',
        url: '/dashboard/third-party/sub-contracts',
        icon: ClipboardList,
      },
      {
        title: 'Vendors',
        url: '/dashboard/third-party/vendors',
        icon: Package,
      },
    ],
  },
  {
    title: 'Resources',
    url: '/dashboard/resources',
    icon: Boxes,
    items: [
      {
        title: 'Inventory',
        url: '/dashboard/resources/inventory',
        icon: Warehouse,
      },
      {
        title: 'Assets',
        url: '/dashboard/resources/assets',
        icon: PackageCheck,
      },
      {
        title: 'Locations',
        url: '/dashboard/resources/locations',
        icon: MapPin,
      },
      {
        title: 'Purchase Orders',
        url: '/dashboard/resources/purchase-orders',
        icon: ShoppingCart,
      },
      {
        title: 'Material Requests',
        url: '/dashboard/resources/material-requests',
        icon: ClipboardList,
      },
      {
        title: 'Transfers',
        url: '/dashboard/resources/transfers',
        icon: ArrowLeftRight,
      },
      {
        title: 'Stock Adjustments',
        url: '/dashboard/resources/stock-adjustments',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'Finance',
    url: '/dashboard/finance',
    icon: Wallet,
    items: [
      { title: 'Receipts', url: '/dashboard/finance/receipts', icon: Receipt },
      {
        title: 'Payments',
        url: '/dashboard/finance/payments',
        icon: CreditCard,
      },
      {
        title: 'Invoices',
        url: '/dashboard/finance/invoices',
        icon: FileSpreadsheet,
      },
      {
        title: 'Expenses',
        url: '/dashboard/finance/expenses',
        icon: TrendingDown,
      },
      { title: 'Budgets', url: '/dashboard/finance/budgets', icon: PiggyBank },
    ],
  },
  { title: 'Reports', url: '/dashboard/reports', icon: BarChart3 },
  { title: 'Documents', url: '/dashboard/documents', icon: FileText },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { state } = useSidebar();

  // Only show sidebar for authenticated users
  if (!session) {
    return null;
  }

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        {/* Expanded state */}
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
          <Image
            src="/echno.png"
            alt="Echno Logo"
            width={32}
            height={32}
            className="dark:invert"
          />
          <span className="text-lg font-semibold">Echno</span>
        </div>
        {/* Collapsed state - centered bigger logo */}
        <div className="hidden items-center justify-center py-1 group-data-[collapsible=icon]:flex">
          <Image
            src="/echno.png"
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
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                const hasChildren = item.items && item.items.length > 0;

                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
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

                const isChildActive =
                  item.items?.some((child) => pathname.startsWith(child.url)) ||
                  false;

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
                            isActive={isActive || isChildActive}
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

                // When expanded, show collapsible menu
                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isChildActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive || isChildActive}
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
                                isActive={pathname === subItem.url}
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
    </SidebarPrimitive>
  );
}
