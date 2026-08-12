/**
 * nav/types.ts
 *
 * Core type definitions for the filesystem-driven navigation platform.
 * All other nav modules import from here.
 */

import type { LucideIcon } from 'lucide-react';
import { AccessConfig } from './access/roles';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DASHBOARD_BASE = '/users/dashboard' as const;

// ---------------------------------------------------------------------------
// Route node — raw structure derived from the filesystem
// ---------------------------------------------------------------------------

export interface RouteNode {
  /** Stable unique ID, e.g. 'finance-receipts' or 'projects-[id]-tasks'. */
  id: string;
  /** URL segment (exact folder name), e.g. 'receipts' or '[id]'. */
  segment: string;
  /** Absolute path template, e.g. '/users/dashboard/finance/receipts'. */
  path: string;
  /** True when segment is a Next.js dynamic param: [param]. */
  isDynamic: boolean;
  /** True when segment is a catch-all: [...slug]. */
  isCatchAll: boolean;
  /** Param name extracted from dynamic segments, e.g. 'id' from [id]. */
  paramName?: string;
  /** Immediate child route nodes. */
  children: RouteNode[];
}

// ---------------------------------------------------------------------------
// Route metadata — human-authored configuration
// ---------------------------------------------------------------------------

export interface RouteMetadata {
  /** Human-readable display label (Title Case). */
  label?: string;
  /** Lucide icon component — only needed for sidebar items. */
  icon?: LucideIcon;
  /** Override breadcrumb label when it differs from label. */
  breadcrumb?: string;
  /** Short description for tooltips / aria. */
  description?: string;
  /** Sidebar render order (lower = higher). Defaults to 999. */
  order?: number;
  /**
   * Sidebar section this item groups under (see nav/sections.ts).
   * Only meaningful on top-level items; ignored on children.
   */
  section?: string;
  /** Excluded from sidebar but still generates breadcrumbs. */
  sidebarHidden?: boolean;
  /** Excluded from the breadcrumb trail entirely. */
  breadcrumbHidden?: boolean;
  /** Renders in breadcrumbs as non-clickable (section headers). */
  nonInteractive?: boolean;
  /** Hide completely (vs. show locked) when user lacks access. */
  hideWhenLocked?: boolean;
  /** Access control config for this route. */
  access?: AccessConfig;
}

/** Flat map from route ID to its metadata. */
export type MetadataRegistry = Record<string, RouteMetadata>;

// ---------------------------------------------------------------------------
// Composed nav item — RouteNode merged with RouteMetadata
// ---------------------------------------------------------------------------

export interface ComposedNavItem {
  // ── Route identity ─────────────────────────────────────────────────────────
  id: string;
  segment: string;
  path: string;
  isDynamic: boolean;
  isCatchAll: boolean;
  paramName?: string;

  // ── Metadata fields ────────────────────────────────────────────────────────
  label: string;
  icon?: LucideIcon;
  breadcrumb?: string;
  description?: string;
  /** Sidebar section id; undefined falls back to DEFAULT_SECTION at render. */
  section?: string;
  sidebarHidden: boolean;
  breadcrumbHidden: boolean;
  nonInteractive: boolean;
  hideWhenLocked: boolean;
  access: AccessConfig;

  /** Composed children (ordered by metadata.order). */
  children: ComposedNavItem[];

  // ── Legacy compat ─────────────────────────────────────────────────────────
  /** @deprecated Use access.allowRoles instead. */
  roles?: string[];
  /** @deprecated Use access.denyRoles instead. */
  hideForRoles?: string[];
}

/**
 * NavItem is a type alias for ComposedNavItem.
 * Preserved for backward compatibility with existing consumers.
 */
export type NavItem = ComposedNavItem;
