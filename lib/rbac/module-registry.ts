/**
 * Module Registry
 *
 * Central registry of all available modules in the system
 * Defines module metadata, pricing, and relationships
 */

import { Module, ModuleCategory, ModuleDefinition } from '@/types/rbac/module';

/**
 * Complete module registry
 * Defines all available modules and their configuration
 */
export const MODULE_REGISTRY: Record<Module, ModuleDefinition> = {
  // ==================== Core Management ====================
  [Module.TASK]: {
    key: Module.TASK,
    name: 'Task Management',
    description: 'Create, assign, and track tasks and work items',
    category: ModuleCategory.CORE,
    isPurchasable: false,
    isFreeFeature: true,
    icon: 'task',
  },

  [Module.PROJECT]: {
    key: Module.PROJECT,
    name: 'Project Management',
    description: 'Plan, organize, and manage projects from start to finish',
    category: ModuleCategory.CORE,
    isPurchasable: false,
    isFreeFeature: true,
    icon: 'project',
  },

  [Module.ISSUE]: {
    key: Module.ISSUE,
    name: 'Issue Tracking',
    description: 'Track, manage, and resolve issues and problems',
    category: ModuleCategory.CORE,
    isPurchasable: false,
    isFreeFeature: true,
    icon: 'issue',
  },

  // ==================== Finance ====================
  [Module.FINANCE]: {
    key: Module.FINANCE,
    name: 'Finance Management',
    description: 'Comprehensive financial management and budgeting',
    category: ModuleCategory.FINANCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'finance',
    price: {
      amount: 49.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  [Module.INVOICE]: {
    key: Module.INVOICE,
    name: 'Invoicing',
    description: 'Create, send, and track invoices',
    category: ModuleCategory.FINANCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'invoice',
    price: {
      amount: 29.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
    dependencies: [Module.FINANCE],
  },

  [Module.EXPENSE]: {
    key: Module.EXPENSE,
    name: 'Expense Tracking',
    description: 'Track and approve expenses and reimbursements',
    category: ModuleCategory.FINANCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'expense',
    price: {
      amount: 19.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
    dependencies: [Module.FINANCE],
  },

  // ==================== Workforce Management ====================
  [Module.WORKFORCE]: {
    key: Module.WORKFORCE,
    name: 'Workforce Management',
    description: 'Comprehensive workforce planning and management',
    category: ModuleCategory.WORKFORCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'workforce',
    price: {
      amount: 39.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  [Module.EMPLOYEE]: {
    key: Module.EMPLOYEE,
    name: 'Employee Management',
    description: 'Manage employee records, profiles, and information',
    category: ModuleCategory.WORKFORCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'employee',
    price: {
      amount: 29.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
    dependencies: [Module.WORKFORCE],
  },

  [Module.ATTENDANCE]: {
    key: Module.ATTENDANCE,
    name: 'Attendance Tracking',
    description: 'Track employee attendance, hours, and time-off',
    category: ModuleCategory.WORKFORCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'attendance',
    price: {
      amount: 19.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
    dependencies: [Module.EMPLOYEE],
  },

  [Module.LEAVE]: {
    key: Module.LEAVE,
    name: 'Leave Management',
    description: 'Manage leave requests, approvals, and balances',
    category: ModuleCategory.WORKFORCE,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'leave',
    price: {
      amount: 14.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
    dependencies: [Module.EMPLOYEE],
  },

  // ==================== Resource Management ====================
  [Module.RESOURCE]: {
    key: Module.RESOURCE,
    name: 'Resource Management',
    description: 'Allocate and track resources across projects',
    category: ModuleCategory.RESOURCES,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'resource',
    price: {
      amount: 34.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  [Module.INVENTORY]: {
    key: Module.INVENTORY,
    name: 'Inventory Management',
    description: 'Track and manage inventory, stock levels, and orders',
    category: ModuleCategory.RESOURCES,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'inventory',
    price: {
      amount: 44.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  [Module.ASSET]: {
    key: Module.ASSET,
    name: 'Asset Management',
    description: 'Track and maintain organizational assets and equipment',
    category: ModuleCategory.RESOURCES,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'asset',
    price: {
      amount: 29.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  // ==================== Quality & Compliance ====================
  [Module.INSPECTION]: {
    key: Module.INSPECTION,
    name: 'Inspections',
    description: 'Conduct, track, and manage quality inspections',
    category: ModuleCategory.QUALITY,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'inspection',
    price: {
      amount: 24.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  // ==================== Third Party ====================
  [Module.VENDOR]: {
    key: Module.VENDOR,
    name: 'Vendor Management',
    description: 'Manage vendor relationships and contracts',
    category: ModuleCategory.THIRD_PARTY,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'vendor',
    price: {
      amount: 19.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  [Module.CONTRACTOR]: {
    key: Module.CONTRACTOR,
    name: 'Contractor Management',
    description: 'Manage contractors and subcontractor relationships',
    category: ModuleCategory.THIRD_PARTY,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'contractor',
    price: {
      amount: 19.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  // ==================== Organization ====================
  [Module.ORGANIZATION]: {
    key: Module.ORGANIZATION,
    name: 'Organization Settings',
    description: 'Manage organization-wide settings and configuration',
    category: ModuleCategory.ADMIN,
    isPurchasable: false,
    isFreeFeature: true,
    icon: 'organization',
  },

  [Module.USER]: {
    key: Module.USER,
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    category: ModuleCategory.ADMIN,
    isPurchasable: false,
    isFreeFeature: true,
    icon: 'user',
  },

  // ==================== Analytics & Reporting ====================
  [Module.REPORT]: {
    key: Module.REPORT,
    name: 'Reporting',
    description: 'Generate and export comprehensive reports',
    category: ModuleCategory.ANALYTICS,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'report',
    price: {
      amount: 29.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  [Module.ANALYTICS]: {
    key: Module.ANALYTICS,
    name: 'Analytics',
    description: 'Advanced analytics and data insights',
    category: ModuleCategory.ANALYTICS,
    isPurchasable: true,
    isFreeFeature: false,
    icon: 'analytics',
    price: {
      amount: 39.99,
      currency: 'USD',
      billingPeriod: 'monthly',
    },
  },

  // ==================== System Administration ====================
  [Module.ADMIN]: {
    key: Module.ADMIN,
    name: 'System Administration',
    description: 'System-level configuration and administration',
    category: ModuleCategory.ADMIN,
    isPurchasable: false,
    isFreeFeature: true,
    icon: 'admin',
  },
};

/**
 * Get module definition by key
 */
export function getModuleDefinition(module: Module): ModuleDefinition {
  return MODULE_REGISTRY[module];
}

/**
 * Get all modules in a category
 */
export function getModulesByCategory(
  category: ModuleCategory
): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter((m) => m.category === category);
}

/**
 * Get all purchasable modules
 */
export function getPurchasableModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter((m) => m.isPurchasable);
}

/**
 * Get all free modules
 */
export function getFreeModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter((m) => m.isFreeFeature);
}

/**
 * Get module dependencies
 * Returns all modules that must be enabled for this module to work
 */
export function getModuleDependencies(module: Module): Module[] {
  const definition = MODULE_REGISTRY[module];
  return definition.dependencies || [];
}

/**
 * Check if module has dependencies
 */
export function hasModuleDependencies(module: Module): boolean {
  const deps = getModuleDependencies(module);
  return deps.length > 0;
}

/**
 * Get module display name
 */
export function getModuleName(module: Module): string {
  return MODULE_REGISTRY[module].name;
}

/**
 * Get all modules
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * Group modules by category
 */
export function groupModulesByCategory(): Record<
  ModuleCategory,
  ModuleDefinition[]
> {
  const grouped: Record<ModuleCategory, ModuleDefinition[]> = {
    [ModuleCategory.CORE]: [],
    [ModuleCategory.FINANCE]: [],
    [ModuleCategory.WORKFORCE]: [],
    [ModuleCategory.RESOURCES]: [],
    [ModuleCategory.QUALITY]: [],
    [ModuleCategory.THIRD_PARTY]: [],
    [ModuleCategory.ADMIN]: [],
    [ModuleCategory.ANALYTICS]: [],
  };

  for (const moduleDefinition of Object.values(MODULE_REGISTRY)) {
    grouped[moduleDefinition.category].push(moduleDefinition);
  }

  return grouped;
}
