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
  /** Id of the project the asset is on, from the latest entry in its movement ledger. */
  assignedProjectId?: number;
  /**
   * The site transfer the asset is in transit on, sent from one project and
   * not yet recorded as arriving at the other. While it is set the asset cannot
   * be moved any other way.
   */
  inTransitSiteTransferId?: number;
  /** Number of that transfer, for display. */
  inTransitSiteTransferNumber?: string;
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

/** Kind of entry in an asset's movement ledger. */
export type AssetMovementType =
  | 'REGISTRATION'
  | 'TRANSFER'
  | 'ASSIGNMENT'
  | 'CORRECTION';

export const assetMovementTypeLabels: Record<AssetMovementType, string> = {
  REGISTRATION: 'Registered',
  TRANSFER: 'Moved',
  ASSIGNMENT: 'Handed over',
  CORRECTION: 'Correction',
};

/**
 * One entry in an asset's movement ledger (`/assets/web/{id}/movements`):
 * where it moved from and to, when, and why. Entries are never edited; a wrong
 * one is superseded by a correction.
 */
export interface AssetMovement {
  id: number;
  movementType: AssetMovementType;
  fromProjectName?: string;
  toProjectName?: string;
  fromLocationName?: string;
  toLocationName?: string;
  fromAssignedTo?: string;
  toAssignedTo?: string;
  movedAt: Date;
  reason: string;
  notes?: string;
  /** The document it came from, for example a site transfer number. */
  referenceNumber?: string;
  /** The site transfer it came from, when the asset moved on one. */
  siteTransferId?: number;
  correctsMovementId?: number;
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
