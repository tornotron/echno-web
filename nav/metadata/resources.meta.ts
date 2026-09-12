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
import type { MetadataRegistry, RouteMetadata } from '../types';
import { STORES_ACCESS } from '../access/roles';

/**
 * The store documents share one backend read threshold (echno-backend #650:
 * store-keeper, project-manager, system-admin). Hidden rather than shown
 * locked: there is nothing to upsell to a labourer who cannot book a GRN.
 * Applied to the hidden detail/new/edit children too, so any consumer that
 * filters the full tree (not only the sidebar) sees the same answer.
 */
const stores = {
  access: STORES_ACCESS,
  hideWhenLocked: true,
} satisfies RouteMetadata;

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
    ...stores,
    label: 'GRN',
    icon: PackageCheck,
    order: 6,
  },
  'resources-goods-receipts-new': {
    ...stores,
    label: 'New GRN',
    sidebarHidden: true,
  },
  'resources-goods-receipts-[id]': {
    ...stores,
    label: 'GRN',
    sidebarHidden: true,
  },

  'resources-indents': {
    ...stores,
    label: 'Indents',
    icon: ClipboardList,
    order: 4,
  },
  'resources-indents-new': {
    ...stores,
    label: 'New Indent',
    sidebarHidden: true,
  },
  'resources-indents-[id]': { ...stores, label: 'Indent', sidebarHidden: true },

  'resources-material-consumptions': {
    ...stores,
    label: 'Material Consumptions',
    icon: TrendingDown,
    order: 8,
  },
  'resources-material-consumptions-new': {
    ...stores,
    label: 'New Consumption',
    sidebarHidden: true,
  },
  'resources-material-consumptions-[id]': {
    ...stores,
    label: 'Consumption',
    sidebarHidden: true,
  },

  'resources-materials': {
    ...stores,
    label: 'Materials',
    icon: Warehouse,
    order: 1,
  },
  'resources-materials-all-materials': {
    ...stores,
    label: 'All Materials',
    sidebarHidden: true,
  },
  'resources-materials-new': {
    ...stores,
    label: 'New Material',
    sidebarHidden: true,
  },
  'resources-materials-[id]': {
    ...stores,
    label: 'Material',
    sidebarHidden: true,
  },
  'resources-materials-[id]-edit': {
    ...stores,
    label: 'Edit',
    sidebarHidden: true,
  },

  'resources-purchase-orders': {
    ...stores,
    label: 'Purchase Orders',
    icon: ShoppingCart,
    order: 5,
  },
  'resources-purchase-orders-new': {
    ...stores,
    label: 'New Purchase Order',
    sidebarHidden: true,
  },
  'resources-purchase-orders-[id]': {
    ...stores,
    label: 'Purchase Order',
    sidebarHidden: true,
  },

  // Shown on the same terms as Assets: their controllers guard on
  // `isMemberOfCurrentTenant() or hasAnyOrgRoleForCurrentTenant('system-admin',
  // 'project-manager')`, so any org member can read them. The store documents
  // above carry `stores` instead (see STORES_ACCESS).
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
    ...stores,
    label: 'Site Transfers',
    icon: ArrowLeftRight,
    order: 7,
  },
  'resources-transfers-new': {
    ...stores,
    label: 'New Transfer',
    sidebarHidden: true,
  },
  'resources-transfers-[id]': {
    ...stores,
    label: 'Transfer',
    sidebarHidden: true,
  },
  'resources-transfers-[id]-edit': {
    ...stores,
    label: 'Edit',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
