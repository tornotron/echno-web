import { ResourceType } from './resource-type';
import { ResourceStatus } from './resource-status';

// Main Resource Interface
export interface Resource {
  id: number;
  resourceId: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  location: string;
  assignedTo?: string;
  assignedProject?: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  supplier?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  usageHours?: number;
  maxUsageHours?: number;
  fuelType?: string;
  specifications?: Record<string, unknown>;
  documents?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Resource for forms
export interface ResourceFormData {
  resourceId: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  location: string;
  assignedTo?: string;
  assignedProject?: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  supplier?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  usageHours?: number;
  maxUsageHours?: number;
  fuelType?: string;
  notes?: string;
}

// Resource Filters
export interface ResourceFilters {
  search: string;
  type: ResourceType | 'all';
  status: ResourceStatus | 'all';
  location: string;
}

// Helper functions
export const getResourceStatusBadgeColor = (status: ResourceStatus): string => {
  const colors = {
    available:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'in-use': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    maintenance:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    damaged: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    retired: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[status];
};

export const getResourceTypeBadgeColor = (type: ResourceType): string => {
  const colors = {
    material: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    equipment:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    tool: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    vehicle:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    other: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[type];
};

export const formatCurrency = (amount: number): string => {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  } else if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

export const calculateUtilization = (
  usageHours?: number,
  maxUsageHours?: number
): number => {
  if (!usageHours || !maxUsageHours) return 0;
  return Math.min((usageHours / maxUsageHours) * 100, 100);
};
