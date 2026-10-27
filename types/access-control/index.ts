/**
 * types/access-control
 *
 * The three tiers of the access model. Each tier is independent; any
 * combination may hold the others:
 *
 * - {@link AccessGroup} (a department or an ad-hoc group) may carry its own
 *   module permissions, a set of roles and a set of users.
 * - {@link AccessRole} carries module permissions and a set of users, and may
 *   sit inside any number of groups.
 * - {@link AccessUser} holds roles and may carry direct permissions on top.
 *
 * Membership is stored once, on the owning side: a role lists its users and a
 * group lists its roles and users. A user's roles and groups are derived.
 */

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * What a permission allows on a module. Each is granted on its own; create,
 * edit and delete all need view, which {@link normalizeActions} adds.
 */
export type AccessAction = 'view' | 'create' | 'edit' | 'delete';

/** Display order. */
export const ACCESS_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
] as const satisfies AccessAction[];

export const ACCESS_ACTION_LABELS: Record<AccessAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};

export const ACCESS_ACTION_DESCRIPTIONS: Record<AccessAction, string> = {
  view: 'See the module and read its records',
  create: 'Add new records',
  edit: 'Change existing records',
  delete: 'Remove records',
};

/**
 * Deduplicates, puts in display order, and adds `view` whenever any other
 * action is present: nobody can change what they cannot see.
 */
export function normalizeActions(
  actions: readonly AccessAction[]
): AccessAction[] {
  const set = new Set(actions);
  if (set.size > 0) set.add('view');
  return ACCESS_ACTIONS.filter((a) => set.has(a));
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export type AccessModuleId =
  | 'dashboard'
  | 'projects'
  | 'wbs'
  | 'progress'
  | 'inspections'
  | 'construction'
  | 'material-consumption'
  | 'assets'
  | 'storage-locations'
  | 'purchase-orders'
  | 'goods-receipts'
  | 'inventory'
  | 'vendors'
  | 'finance'
  | 'compliance'
  | 'documents'
  | 'team'
  | 'leave'
  | 'leave-regularisation'
  | 'reports'
  | 'echno-bot';

export type AccessModuleSectionId =
  | 'general'
  | 'projects'
  | 'resources'
  | 'finance'
  | 'people';

export interface AccessModuleSection {
  id: AccessModuleSectionId;
  label: string;
}

/** The headings the permission editor groups modules under, in display order. */
export const ACCESS_MODULE_SECTIONS: readonly AccessModuleSection[] = [
  { id: 'general', label: 'General' },
  { id: 'projects', label: 'Projects & Site' },
  { id: 'resources', label: 'Resources & Procurement' },
  { id: 'finance', label: 'Finance & Compliance' },
  { id: 'people', label: 'People' },
];

export interface AccessModule {
  id: AccessModuleId;
  label: string;
  section: AccessModuleSectionId;
}

/**
 * The modules and features a permission can be set on. The order is the
 * seed data's column order; the editor regroups them by section.
 */
export const ACCESS_MODULES: readonly AccessModule[] = [
  { id: 'dashboard', label: 'Dashboard', section: 'general' },
  { id: 'projects', label: 'Projects & Project Settings', section: 'projects' },
  { id: 'wbs', label: 'WBS & Schedule', section: 'projects' },
  { id: 'progress', label: 'Progress Tracking', section: 'projects' },
  { id: 'inspections', label: 'Inspections (QA/QC)', section: 'projects' },
  { id: 'construction', label: 'Construction Management', section: 'projects' },
  {
    id: 'material-consumption',
    label: 'Materials Consumption',
    section: 'resources',
  },
  { id: 'assets', label: 'Assets (Equipment)', section: 'resources' },
  { id: 'storage-locations', label: 'Storage Locations', section: 'resources' },
  { id: 'purchase-orders', label: 'Purchase Orders', section: 'resources' },
  { id: 'goods-receipts', label: 'Goods Receipt (GRN)', section: 'resources' },
  { id: 'inventory', label: 'Inventory', section: 'resources' },
  { id: 'vendors', label: 'Vendors', section: 'resources' },
  { id: 'finance', label: 'Finance', section: 'finance' },
  { id: 'compliance', label: 'Compliance & Approvals', section: 'finance' },
  { id: 'documents', label: 'Documents', section: 'general' },
  { id: 'team', label: 'Team / HR & Attendance', section: 'people' },
  { id: 'leave', label: 'Leave Management', section: 'people' },
  {
    id: 'leave-regularisation',
    label: 'Leave Regularisation',
    section: 'people',
  },
  { id: 'reports', label: 'Reports & Analytics', section: 'general' },
  { id: 'echno-bot', label: 'Echno Bot', section: 'general' },
];

/**
 * The actions granted per module. A module left out, or with an empty list,
 * grants nothing. Grants only add up: a group or a direct grant can give a
 * user more than their role does, never less.
 */
export type PermissionMap = Partial<Record<AccessModuleId, AccessAction[]>>;

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export interface AccessRole {
  id: number;
  name: string;
  /** Short qualifier shown under the name in the matrix, e.g. "Site Execution". */
  subtitle?: string;
  description: string;
  /** System roles mirror backend org roles and cannot be renamed or deleted. */
  isSystem: boolean;
  permissions: PermissionMap;
  userIds: number[];
}

export type AccessGroupKind = 'department' | 'group';

export const ACCESS_GROUP_KIND_LABELS: Record<AccessGroupKind, string> = {
  department: 'Department',
  group: 'Group',
};

export interface AccessGroup {
  id: number;
  name: string;
  description: string;
  kind: AccessGroupKind;
  permissions: PermissionMap;
  roleIds: number[];
  userIds: number[];
}

export interface AccessUser {
  id: number;
  name: string;
  email: string;
  designation: string;
  isActive: boolean;
  /** Direct grants on top of what the user's roles and groups give. */
  permissions: PermissionMap;
}

// ---------------------------------------------------------------------------
// Write payloads
// ---------------------------------------------------------------------------

export type AccessRoleInput = Omit<AccessRole, 'id' | 'isSystem'> & {
  /** The groups that list this role. Stored on the groups, written from here too. */
  groupIds: number[];
};
export type AccessGroupInput = Omit<AccessGroup, 'id'>;

export interface AccessUserAssignmentInput {
  roleIds: number[];
  groupIds: number[];
  permissions: PermissionMap;
}

// ---------------------------------------------------------------------------
// Effective access
// ---------------------------------------------------------------------------

export type AccessSourceKind = 'direct' | 'role' | 'group';

/** One contribution to a user's actions on a module. */
export interface AccessSource {
  kind: AccessSourceKind;
  /** Role or group name; "Direct" for a direct grant. */
  name: string;
  actions: AccessAction[];
}

export interface EffectiveAccess {
  actions: AccessAction[];
  sources: AccessSource[];
}

/**
 * Resolves a user's actions on every module: the union of their direct
 * grants, each of their roles, each group that lists them, and each group
 * that lists one of their roles.
 */
export function resolveEffectiveAccess(
  userId: number,
  user: Pick<AccessUser, 'permissions'> | undefined,
  roles: readonly AccessRole[],
  groups: readonly AccessGroup[]
): Record<AccessModuleId, EffectiveAccess> {
  const userRoles = roles.filter((r) => r.userIds.includes(userId));
  const userRoleIds = new Set(userRoles.map((r) => r.id));
  const userGroups = groups.filter(
    (g) =>
      g.userIds.includes(userId) || g.roleIds.some((id) => userRoleIds.has(id))
  );

  const result = {} as Record<AccessModuleId, EffectiveAccess>;
  for (const { id } of ACCESS_MODULES) {
    const candidates: {
      kind: AccessSourceKind;
      name: string;
      actions?: AccessAction[];
    }[] = [
      { kind: 'direct', name: 'Direct', actions: user?.permissions[id] },
      ...userRoles.map((r) => ({
        kind: 'role' as const,
        name: r.name,
        actions: r.permissions[id],
      })),
      ...userGroups.map((g) => ({
        kind: 'group' as const,
        name: g.name,
        actions: g.permissions[id],
      })),
    ];
    const sources: AccessSource[] = [];
    for (const c of candidates) {
      if (c.actions && c.actions.length > 0)
        sources.push({
          kind: c.kind,
          name: c.name,
          actions: normalizeActions(c.actions),
        });
    }
    result[id] = {
      actions: normalizeActions(sources.flatMap((s) => s.actions)),
      sources,
    };
  }
  return result;
}
