import { Location } from './location';

// Asset (Non-consumables, Equipment, Machinery, Vehicles)
export interface Asset {
  id: number;
  assetId: string;
  name: string;
  description: string;
  type: AssetType;
  category: string;
  status: AssetStatus;
  condition: AssetCondition;
  locationId: number;
  location: Location;
  assignedTo?: string;
  assignedToId?: number;
  assignedProject?: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  vendorId?: number; // Foreign key to Vendor
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  registrationNumber?: string;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceSchedule?: string;
  usageHours?: number;
  maxUsageHours?: number;
  fuelType?: string;
  insuranceExpiry?: Date;
  insuranceProvider?: string;
  policyNumber?: string;
  specifications?: Record<string, unknown>;
  documents?: string[];
  notes?: string;
  locationHistory?: import('./asset').AssetLocationHistory[];

  // Financial Tracking
  purchaseOrderId?: number; // Foreign key to PurchaseOrder (original purchase)
  invoiceId?: number; // Foreign key to Invoice (original purchase invoice)
  maintenanceExpenseIds: number[]; // Foreign keys to Expense[] (maintenance costs)

  createdAt: Date;
  updatedAt: Date;
}

export interface AssetLocationHistory {
  id: number;
  assetId: number;
  fromLocationId?: number;
  fromLocation?: Location;
  toLocationId?: number;
  toLocation?: Location;
  transferDate: Date;
  transferredBy: string;
  reason: string;
  notes?: string;
  previousAssignedTo?: string;
  newAssignedTo?: string;
  previousProject?: string;
  newProject?: string;
}

// Asset Types
export type AssetType =
  | 'heavy-equipment'
  | 'light-equipment'
  | 'vehicle'
  | 'tool'
  | 'machinery'
  | 'generator'
  | 'computer'
  | 'furniture'
  | 'other';

export const assetTypeLabels: Record<AssetType, string> = {
  'heavy-equipment': 'Heavy Equipment',
  'light-equipment': 'Light Equipment',
  vehicle: 'Vehicle',
  tool: 'Tool',
  machinery: 'Machinery',
  generator: 'Generator',
  computer: 'Computer & IT',
  furniture: 'Furniture',
  other: 'Other',
};

// Asset Status
export type AssetStatus =
  | 'available'
  | 'in-use'
  | 'maintenance'
  | 'repair'
  | 'damaged'
  | 'retired'
  | 'disposed';

export const assetStatusLabels: Record<AssetStatus, string> = {
  available: 'Available',
  'in-use': 'In Use',
  maintenance: 'Maintenance',
  repair: 'Under Repair',
  damaged: 'Damaged',
  retired: 'Retired',
  disposed: 'Disposed',
};

export const assetStatusColors: Record<AssetStatus, string> = {
  available: 'green',
  'in-use': 'blue',
  maintenance: 'orange',
  repair: 'yellow',
  damaged: 'red',
  retired: 'zinc',
  disposed: 'zinc',
};

// Asset Condition
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export const assetConditionLabels: Record<AssetCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  damaged: 'Damaged',
};

export const assetConditionColors: Record<AssetCondition, string> = {
  excellent: 'green',
  good: 'blue',
  fair: 'orange',
  poor: 'red',
  damaged: 'red',
};

// Asset filters
export interface AssetFilters {
  search: string;
  type: AssetType | 'all';
  status: AssetStatus | 'all';
  condition: AssetCondition | 'all';
  locationId: number | 'all';
  maintenanceDue: boolean;
}

// Helper functions
export const getAssetStatusBadgeColor = (status: AssetStatus): string => {
  const colors = {
    available:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'in-use': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    maintenance:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    repair:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    damaged: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    retired: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    disposed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[status];
};

export const getAssetConditionBadgeColor = (
  condition: AssetCondition
): string => {
  const colors = {
    excellent:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    good: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    fair: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    poor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    damaged: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[condition];
};

export const calculateUtilization = (
  usageHours?: number,
  maxUsageHours?: number
): number => {
  if (!usageHours || !maxUsageHours) return 0;
  return Math.min((usageHours / maxUsageHours) * 100, 100);
};

export const calculateDepreciation = (
  purchasePrice: number,
  purchaseDate: Date,
  depreciationRate: number
): number => {
  const years =
    (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const depreciation = purchasePrice * (depreciationRate / 100) * years;
  return Math.max(purchasePrice - depreciation, 0);
};

export const isMaintenanceDue = (asset: Asset): boolean => {
  if (!asset.nextMaintenanceDate) return false;
  const today = new Date();
  const daysUntilMaintenance = Math.floor(
    (asset.nextMaintenanceDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return daysUntilMaintenance <= 7;
};
