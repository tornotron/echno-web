import {
  Boxes,
  PackageCheck,
  MapPin,
  ClipboardList,
  ShoppingCart,
  ArrowLeftRight,
  TrendingDown,
  Warehouse,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const resourcesMetadata = {
  resources: {
    label: 'Resources',
    icon: Boxes,
    nonInteractive: true,
    section: 'operations',
    order: 6,
  },

  'resources-assets': {
    label: 'Assets',
    icon: PackageCheck,
    order: 2,
  },
  'resources-assets-new': { label: 'New Asset', sidebarHidden: true },
  'resources-assets-[id]': { label: 'Asset', sidebarHidden: true },
  'resources-assets-[id]-edit': { label: 'Edit', sidebarHidden: true },

  'resources-goods-receipts': {
    label: 'GRN',
    icon: PackageCheck,
    order: 6,
  },
  'resources-goods-receipts-new': { label: 'New GRN', sidebarHidden: true },
  'resources-goods-receipts-[id]': { label: 'GRN', sidebarHidden: true },

  'resources-indents': {
    label: 'Indents',
    icon: ClipboardList,
    order: 4,
  },
  'resources-indents-new': { label: 'New Indent', sidebarHidden: true },
  'resources-indents-[id]': { label: 'Indent', sidebarHidden: true },

  'resources-material-consumptions': {
    label: 'Material Consumptions',
    icon: TrendingDown,
    order: 8,
  },
  'resources-material-consumptions-new': {
    label: 'New Consumption',
    sidebarHidden: true,
  },
  'resources-material-consumptions-[id]': {
    label: 'Consumption',
    sidebarHidden: true,
  },

  'resources-materials': {
    label: 'Materials',
    icon: Warehouse,
    order: 1,
  },
  'resources-materials-all-materials': {
    label: 'All Materials',
    sidebarHidden: true,
  },
  'resources-materials-new': { label: 'New Material', sidebarHidden: true },
  'resources-materials-[id]': { label: 'Material', sidebarHidden: true },
  'resources-materials-[id]-edit': { label: 'Edit', sidebarHidden: true },

  'resources-purchase-orders': {
    label: 'Purchase Orders',
    icon: ShoppingCart,
    order: 5,
  },
  'resources-purchase-orders-new': {
    label: 'New Purchase Order',
    sidebarHidden: true,
  },
  'resources-purchase-orders-[id]': {
    label: 'Purchase Order',
    sidebarHidden: true,
  },

  // Shown on the same terms as Assets. Those two are the only Resources
  // modules a plain org member can read: their controllers guard on
  // `isMemberOfCurrentTenant() or hasAnyOrgRoleForCurrentTenant('system-admin',
  // 'project-manager')`, where the other eleven are system-admin only on every
  // method, reads included.
  'resources-stock-adjustments': {
    label: 'Stock Adjustments',
    icon: ArrowLeftRight,
    order: 9,
  },
  'resources-stock-adjustments-new': {
    label: 'New Adjustment',
    sidebarHidden: true,
  },
  'resources-stock-adjustments-[id]': {
    label: 'Adjustment',
    sidebarHidden: true,
  },
  'resources-stock-adjustments-[id]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  'resources-storage-locations': {
    label: 'Storage Locations',
    icon: MapPin,
    order: 3,
  },
  'resources-storage-locations-new': {
    label: 'New Location',
    sidebarHidden: true,
  },
  'resources-storage-locations-[id]': {
    label: 'Storage Location',
    sidebarHidden: true,
  },
  'resources-storage-locations-[id]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  'resources-transfers': {
    label: 'Site Transfers',
    icon: ArrowLeftRight,
    order: 7,
  },
  'resources-transfers-new': { label: 'New Transfer', sidebarHidden: true },
  'resources-transfers-[id]': { label: 'Transfer', sidebarHidden: true },
  'resources-transfers-[id]-edit': { label: 'Edit', sidebarHidden: true },
} satisfies MetadataRegistry;
