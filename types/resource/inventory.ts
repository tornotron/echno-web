import { Location } from './location';

// Inventory Item (Consumables, Materials)
export interface InventoryItem {
  id: number;
  itemId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  locationId: number;
  location: Location;
  unitPrice: number;
  totalValue: number;
  vendorId?: number; // Foreign key to Vendor
  brand?: string;
  specifications?: Record<string, unknown>;
  batchNumber?: string;
  expiryDate?: Date;
  lastRestockedDate?: Date;
  lastUsedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory categories
export type InventoryCategory =
  | 'cement'
  | 'steel'
  | 'aggregates'
  | 'bricks'
  | 'tiles'
  | 'paints'
  | 'electrical'
  | 'plumbing'
  | 'hardware'
  | 'safety-equipment'
  | 'other';

export const inventoryCategoryLabels: Record<InventoryCategory, string> = {
  cement: 'Cement',
  steel: 'Steel & Reinforcement',
  aggregates: 'Aggregates',
  bricks: 'Bricks & Blocks',
  tiles: 'Tiles & Flooring',
  paints: 'Paints & Finishes',
  electrical: 'Electrical Materials',
  plumbing: 'Plumbing Materials',
  hardware: 'Hardware & Fixtures',
  'safety-equipment': 'Safety Equipment',
  other: 'Other',
};

// Inventory filters
export interface InventoryFilters {
  search: string;
  category: InventoryCategory | 'all';
  locationId: number | 'all';
  lowStock: boolean;
  outOfStock: boolean;
}

// Helper functions
export const getStockStatus = (
  item: InventoryItem
): 'out-of-stock' | 'low' | 'optimal' | 'excess' => {
  if (item.quantity === 0) return 'out-of-stock';
  if (item.quantity <= item.reorderPoint) return 'low';
  if (item.quantity > item.maxStockLevel) return 'excess';
  return 'optimal';
};

export const getStockStatusColor = (status: string): string => {
  const colors = {
    'out-of-stock': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    low: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    optimal:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    excess: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };
  return colors[status as keyof typeof colors] || colors.optimal;
};
