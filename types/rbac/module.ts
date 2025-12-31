/**
 * Module-Centric RBAC Types
 *
 * This file defines the core types for the module-centric access control system.
 * Modules represent purchasable/enableable features that users can access.
 */

/**
 * Standardized actions that can be performed on modules
 * These represent common CRUD operations plus special actions
 */
export type ModuleAction =
  | 'view' // Read/view data
  | 'create' // Create new records
  | 'update' // Modify existing records
  | 'delete' // Remove records
  | 'assign' // Assign resources/tasks to users
  | 'approve'; // Approve/authorize records

/**
 * Available modules in the system
 * Each module represents a distinct feature area
 */
export enum Module {
  // Core Management
  TASK = 'task',
  PROJECT = 'project',
  ISSUE = 'issue',

  // Finance
  FINANCE = 'finance',
  INVOICE = 'invoice',
  EXPENSE = 'expense',

  // Workforce Management
  WORKFORCE = 'workforce',
  EMPLOYEE = 'employee',
  ATTENDANCE = 'attendance',
  LEAVE = 'leave',

  // Resource Management
  RESOURCE = 'resource',
  INVENTORY = 'inventory',
  ASSET = 'asset',

  // Quality & Compliance
  INSPECTION = 'inspection',

  // Third Party
  VENDOR = 'vendor',
  CONTRACTOR = 'contractor',

  // Organization
  ORGANIZATION = 'organization',
  USER = 'user',

  // Analytics & Reporting
  REPORT = 'report',
  ANALYTICS = 'analytics',

  // System Administration
  ADMIN = 'admin',
}

/**
 * Module metadata and configuration
 */
export interface ModuleDefinition {
  /** Unique module identifier */
  key: Module;

  /** Display name */
  name: string;

  /** Description of module functionality */
  description: string;

  /** Category for grouping in UI */
  category: ModuleCategory;

  /** Whether this module requires purchase/license */
  isPurchasable: boolean;

  /** Price information if purchasable */
  price?: {
    amount: number;
    currency: string;
    billingPeriod: 'monthly' | 'yearly' | 'one-time';
  };

  /** Whether module is available in free tier */
  isFreeFeature: boolean;

  /** Icon identifier for UI */
  icon?: string;

  /** Dependencies - other modules required for this to work */
  dependencies?: Module[];
}

/**
 * Module categories for organization
 */
export enum ModuleCategory {
  CORE = 'core',
  FINANCE = 'finance',
  WORKFORCE = 'workforce',
  RESOURCES = 'resources',
  QUALITY = 'quality',
  THIRD_PARTY = 'third_party',
  ADMIN = 'admin',
  ANALYTICS = 'analytics',
}

/**
 * Role-to-Module capability mapping
 * Defines what actions a role can perform on a specific module
 */
export interface RoleModulePolicy {
  /** Role identifier */
  roleId: string;

  /** Module this policy applies to */
  module: Module;

  /** Actions the role can perform on this module */
  allowedActions: ModuleAction[];

  /** Contextual constraints (e.g., "own" records only) */
  context?: {
    /** User can only access their own records */
    ownOnly?: boolean;

    /** User can access team/department records */
    teamOnly?: boolean;

    /** User can access all organizational records */
    allRecords?: boolean;

    /** Custom conditions */
    conditions?: Record<string, unknown>;
  };
}

/**
 * User-to-Module entitlement
 * Tracks which modules a user/organization has access to
 */
export interface UserModuleEntitlement {
  /** Unique entitlement ID */
  id: string;

  /** User ID (if user-level entitlement) */
  userId?: string;

  /** Organization ID (if org-level entitlement) */
  organizationId: string;

  /** Module this entitlement grants access to */
  module: Module;

  /** Whether the module is currently enabled */
  isEnabled: boolean;

  /** Whether the module has been purchased/licensed */
  isPurchased: boolean;

  /** Entitlement status */
  status: EntitlementStatus;

  /** When the entitlement was granted */
  grantedAt: Date;

  /** When the entitlement expires (if applicable) */
  expiresAt?: Date;

  /** Who granted this entitlement */
  grantedBy?: string;

  /** License information */
  license?: {
    type: 'trial' | 'paid' | 'enterprise' | 'free';
    seats?: number; // Number of users allowed
    features?: string[]; // Specific features within module
  };

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Entitlement status
 */
export enum EntitlementStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  PENDING = 'pending',
}

/**
 * Access check context
 * Information provided when checking if a user can perform an action
 */
export interface AccessContext {
  /** User requesting access */
  userId: string;

  /** User's roles */
  userRoles: string[];

  /** Organization context */
  organizationId: string;

  /** Resource being accessed (optional) */
  resource?: {
    id: string;
    type: string;
    ownerId?: string;
    teamId?: string;
    metadata?: Record<string, unknown>;
  };

  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Access check result
 */
export interface AccessCheckResult {
  /** Whether access is granted */
  allowed: boolean;

  /** Reason for the decision */
  reason: string;

  /** Which policy/rule granted or denied access */
  appliedPolicy?: {
    type: 'entitlement' | 'role' | 'context';
    details: string;
  };

  /** Required actions to gain access (if denied) */
  requiredActions?: string[];
}

/**
 * Module action context
 * Specific context for checking a module action
 */
export interface ModuleActionContext extends AccessContext {
  /** Module being accessed */
  module: Module;

  /** Action being performed */
  action: ModuleAction;
}
