/**
 * config/nav.config.ts
 *
 * Centralized navigation configuration — the single source of truth for
 * sidebar items, breadcrumb labels, route metadata, and role-based access.
 *
 * RULES:
 * - Every navigable route in the app should be represented here.
 * - The sidebar and breadcrumbs derive their data from this config.
 * - Feature-specific sub-navigation (e.g. leave management role-based menus)
 *   can extend this config via their own feature files.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Home,
  // MessagesSquare, // temporarily disabled – moving chat to separate branch
  FolderKanban,
  ClipboardCheck,
  Users,
  Mail,
  Calendar,
  UserCheck,
  Handshake,
  HardHat,
  ClipboardList,
  Package,
  Boxes,
  Warehouse,
  PackageCheck,
  MapPin,
  ShoppingCart,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  TrendingDown,
  PiggyBank,
  Settings,
  Building,
  FileText,
  Plus,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  /** Display label — used in the sidebar and as the default breadcrumb text. */
  label: string;

  /** URL path segment (e.g. 'projects', 'workforce'). */
  segment: string;

  /** Full absolute path (e.g. '/users/dashboard/projects'). */
  path: string;

  /** Lucide icon component (optional — only needed for sidebar items). */
  icon?: LucideIcon;

  /** Organization roles required to view this item (empty/undefined = all). */
  roles?: string[];

  /** Organization roles that should NOT see this item. */
  hideForRoles?: string[];

  /** Nested child navigation items. */
  children?: NavItem[];

  /** Override the breadcrumb label (when it should differ from `label`). */
  breadcrumb?: string;

  /** Tooltip or aria description. */
  description?: string;

  // ── Visibility flags ──────────────────────────────────────────────

  /** If true, this item is excluded from the sidebar but still used for breadcrumbs. */
  sidebarHidden?: boolean;

  /** If true, shown in breadcrumbs but NOT clickable (section headers). */
  nonInteractive?: boolean;

  /** If true, this segment is excluded from the breadcrumb trail. */
  breadcrumbHidden?: boolean;

  /** If true, hide completely when the user doesn't have access (instead of showing a locked state). */
  hideWhenLocked?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base path prefix for all authenticated dashboard routes. */
export const DASHBOARD_BASE = '/users/dashboard';

// ---------------------------------------------------------------------------
// Helper to build full dashboard paths
// ---------------------------------------------------------------------------

function d(relativePath: string): string {
  return `${DASHBOARD_BASE}${relativePath ? `/${relativePath}` : ''}`;
}

// ---------------------------------------------------------------------------
// Navigation tree
// ---------------------------------------------------------------------------

/**
 * The primary navigation tree. Every entry here can power:
 *  - Sidebar menu items (entries without `sidebarHidden`)
 *  - Breadcrumb segment labels
 *  - Role-based visibility checks
 *
 * **Ordering** matters — it determines the sidebar item order.
 */
export const navigation: NavItem[] = [
  // ====================== DASHBOARD ========================================
  {
    label: 'Dashboard',
    segment: 'dashboard',
    path: d(''),
    icon: Home,
    breadcrumbHidden: true, // "users > dashboard" is always hidden
  },

  // ====================== CHAT (temporarily disabled – moving to separate branch)
  // {
  //   label: 'Chat',
  //   segment: 'chat',
  //   path: d('chat'),
  //   icon: MessagesSquare,
  // },

  // ====================== PROJECTS =========================================
  {
    label: 'Projects',
    segment: 'projects',
    path: d('projects'),
    icon: FolderKanban,
    children: [
      {
        label: 'All Projects',
        segment: 'projects',
        path: d('projects'),
        icon: FolderKanban,
        breadcrumb: 'Projects',
      },
      {
        label: 'Inspections',
        segment: 'inspections',
        path: d('projects/inspections'),
        icon: ClipboardCheck,
      },
    ],
  },

  // ====================== WORKFORCE ========================================
  {
    label: 'Workforce',
    segment: 'workforce',
    path: d('workforce'),
    icon: Users,
    nonInteractive: true, // section header in breadcrumbs
    children: [
      {
        label: 'Employees',
        segment: 'employees',
        path: d('workforce/employees'),
        icon: Users,
      },
      {
        label: 'Invitations',
        segment: 'invitations',
        path: d('workforce/invitations'),
        icon: Mail,
      },
      {
        label: 'Leave Management',
        segment: 'leaves',
        path: d('workforce/leaves'),
        icon: Calendar,
        breadcrumb: 'Leave Management',
        children: [
          {
            label: 'My Requests',
            segment: 'requests',
            path: d('workforce/leaves/requests'),
            icon: FileText,
            breadcrumb: 'My Requests',
            sidebarHidden: true,
          },
          {
            label: 'Organization Requests',
            segment: 'organization-requests',
            path: d('workforce/leaves/organization-requests'),
            icon: FileText,
            sidebarHidden: true,
          },
          {
            label: 'Apply for Leave',
            segment: 'apply',
            path: d('workforce/leaves/apply'),
            icon: Plus,
            sidebarHidden: true,
          },
          {
            label: 'Leave Calendar',
            segment: 'calendar',
            path: d('workforce/leaves/calendar'),
            icon: Calendar,
            sidebarHidden: true,
          },
          {
            label: 'Leave Balance',
            segment: 'balance',
            path: d('workforce/leaves/balance'),
            icon: TrendingUp,
            sidebarHidden: true,
          },
          {
            label: 'Leave Policies',
            segment: 'policies',
            path: d('workforce/leaves/policies'),
            icon: Settings,
            sidebarHidden: true,
          },
          {
            label: 'Leave Approvals',
            segment: 'approvals',
            path: d('workforce/leaves/approvals'),
            icon: ClipboardCheck,
            sidebarHidden: true,
          },
        ],
      },
    ],
  },

  // ====================== ATTENDANCE =======================================
  {
    label: 'Attendance',
    segment: 'attendance',
    path: d('attendance'),
    icon: UserCheck,
    children: [
      {
        label: 'All Attendance',
        segment: 'attendance',
        path: d('attendance'),
        icon: ClipboardCheck,
        breadcrumb: 'Attendance',
      },
      {
        label: 'Mark Attendance',
        segment: 'mark',
        path: d('attendance/mark'),
        icon: UserCheck,
      },
      {
        label: 'Settings',
        segment: 'settings',
        path: d('attendance/settings'),
        icon: Settings,
        breadcrumb: 'Attendance Settings',
      },
    ],
  },

  // ====================== THIRD PARTY ======================================
  {
    label: 'Third Party',
    segment: 'third-party',
    path: d('third-party'),
    icon: Handshake,
    nonInteractive: true,
    children: [
      {
        label: 'Labour',
        segment: 'labour',
        path: d('third-party/labour'),
        icon: HardHat,
      },
      {
        label: 'Sub-Contracts',
        segment: 'sub-contracts',
        path: d('third-party/sub-contracts'),
        icon: ClipboardList,
      },
      {
        label: 'Vendors',
        segment: 'vendors',
        path: d('third-party/vendors'),
        icon: Package,
      },
    ],
  },

  // ====================== RESOURCES ========================================
  {
    label: 'Resources',
    segment: 'resources',
    path: d('resources'),
    icon: Boxes,
    nonInteractive: true,
    children: [
      {
        label: 'Inventory',
        segment: 'inventory',
        path: d('resources/inventory'),
        icon: Warehouse,
      },
      {
        label: 'Assets',
        segment: 'assets',
        path: d('resources/assets'),
        icon: PackageCheck,
      },
      {
        label: 'Locations',
        segment: 'locations',
        path: d('resources/locations'),
        icon: MapPin,
      },
      {
        label: 'Purchase Orders',
        segment: 'purchase-orders',
        path: d('resources/purchase-orders'),
        icon: ShoppingCart,
      },
      {
        label: 'Goods Receipts',
        segment: 'goods-receipts',
        path: d('resources/goods-receipts'),
        icon: PackageCheck,
      },
      {
        label: 'Material Requests',
        segment: 'material-requests',
        path: d('resources/material-requests'),
        icon: ClipboardList,
      },
      {
        label: 'Transfers',
        segment: 'transfers',
        path: d('resources/transfers'),
        icon: ArrowLeftRight,
      },
      {
        label: 'Stock Adjustments',
        segment: 'stock-adjustments',
        path: d('resources/stock-adjustments'),
        icon: TrendingUp,
      },
    ],
  },

  // ====================== FINANCE ==========================================
  {
    label: 'Finance',
    segment: 'finance',
    path: d('finance'),
    icon: Wallet,
    children: [
      {
        label: 'Receipts',
        segment: 'receipts',
        path: d('finance/receipts'),
        icon: Receipt,
      },
      {
        label: 'Payments',
        segment: 'payments',
        path: d('finance/payments'),
        icon: CreditCard,
      },
      {
        label: 'Invoices',
        segment: 'invoices',
        path: d('finance/invoices'),
        icon: FileSpreadsheet,
      },
      {
        label: 'Expenses',
        segment: 'expenses',
        path: d('finance/expenses'),
        icon: TrendingDown,
      },
      {
        label: 'Budgets',
        segment: 'budgets',
        path: d('finance/budgets'),
        icon: PiggyBank,
      },
    ],
  },

  // ====================== SETTINGS (sidebar-hidden, breadcrumb-only) =======
  {
    label: 'Settings',
    segment: 'settings',
    path: d('settings'),
    icon: Settings,
    sidebarHidden: true,
  },

  // ====================== ORGANIZATIONS (sidebar-hidden) ===================
  {
    label: 'Organizations',
    segment: 'organizations',
    path: d('organizations'),
    icon: Building,
    sidebarHidden: true,
    children: [
      {
        label: 'Join Organization',
        segment: 'join',
        path: d('organizations/join'),
        sidebarHidden: true,
      },
    ],
  },

  // ====================== TASKS (nested under projects, breadcrumb-only) ===
  {
    label: 'Tasks',
    segment: 'tasks',
    path: d('projects/:id/tasks'),
    sidebarHidden: true,
  },

  // ====================== ISSUES (nested under projects, breadcrumb-only) ==
  {
    label: 'Issues',
    segment: 'issues',
    path: d('projects/:id/issues'),
    sidebarHidden: true,
  },

  // ====================== SITE / PORTAL / LEARNING (sidebar-hidden) ========
  {
    label: 'Site',
    segment: 'site',
    path: d('site'),
    sidebarHidden: true,
  },
  {
    label: 'Portal',
    segment: 'portal',
    path: d('portal'),
    icon: LayoutDashboard,
    sidebarHidden: true,
  },
  {
    label: 'Learning',
    segment: 'learning',
    path: d('learning'),
    icon: GraduationCap,
    sidebarHidden: true,
  },
];

// ---------------------------------------------------------------------------
// Public / marketing routes
// ---------------------------------------------------------------------------

/**
 * Centralised path constants for all public (unauthenticated) pages.
 * Import `publicRoutes` wherever you need to link to marketing / legal pages
 * so paths are never hardcoded in components.
 */
export const publicRoutes = {
  home: '/',
  features: '/features',
  plans: '/plans',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  register: '/register',
  login: '/login',
  profile: '/profile',
  profileEdit: '/profile/edit',
  accessDenied: '/access-denied',
} as const;

// ---------------------------------------------------------------------------
// Segment labels — for route segments that are NOT in the navigation tree
// (action pages, generic CRUD suffixes, etc.)
// ---------------------------------------------------------------------------

/**
 * Maps URL segments to human-readable labels for breadcrumbs.
 * Only needed for segments that don't appear in `navigation`.
 */
export const segmentLabels: Record<string, string> = {
  new: 'New',
  edit: 'Edit',
  mark: 'Mark Attendance',
  join: 'Join Organization',
  profile: 'Profile',
  login: 'Login',
  admin: 'Administrator',
  'leave-requests': 'Leave Requests',
};

// ---------------------------------------------------------------------------
// Segments that should never appear in breadcrumbs
// ---------------------------------------------------------------------------

export const hiddenSegments: ReadonlySet<string> = new Set([
  'users',
  'dashboard',
]);

// ---------------------------------------------------------------------------
// Segments that appear in breadcrumbs but are NOT clickable
// ---------------------------------------------------------------------------

export const nonInteractiveSegments: ReadonlySet<string> = new Set(
  navigation.filter((item) => item.nonInteractive).map((item) => item.segment)
);
