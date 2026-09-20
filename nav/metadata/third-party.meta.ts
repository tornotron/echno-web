import { Handshake, HardHat, ClipboardList, Package } from 'lucide-react';
import type { MetadataRegistry, RouteMetadata } from '../types';
import {
  LABOUR_ACCESS,
  SUB_CONTRACT_WRITE_ACCESS,
  VENDOR_READ_ACCESS,
  VENDOR_WRITE_ACCESS,
} from '../access/roles';

/**
 * The third-party registers mirror their backend guards (echno-backend #853).
 * Labour is HR's register throughout; vendors are read by the store and
 * written by the administrator; sub-contracts are read by any member and
 * written by the project pair. Hidden when locked: nothing to upsell.
 */
const labour = {
  access: LABOUR_ACCESS,
  hideWhenLocked: true,
} satisfies RouteMetadata;
const vendorRead = {
  access: VENDOR_READ_ACCESS,
  hideWhenLocked: true,
} satisfies RouteMetadata;
const vendorWrite = {
  access: VENDOR_WRITE_ACCESS,
  hideWhenLocked: true,
} satisfies RouteMetadata;
const subContractWrite = {
  access: SUB_CONTRACT_WRITE_ACCESS,
  hideWhenLocked: true,
} satisfies RouteMetadata;

export const thirdPartyMetadata = {
  'third-party': {
    label: 'Third Party',
    icon: Handshake,
    nonInteractive: true,
    section: 'operations',
    order: 9,
  },

  'third-party-labour': {
    ...labour,
    label: 'Labour',
    icon: HardHat,
    order: 1,
  },
  'third-party-labour-new': {
    ...labour,
    label: 'New Labour',
    sidebarHidden: true,
  },
  'third-party-labour-[id]': {
    ...labour,
    label: 'Labour',
    sidebarHidden: true,
  },
  'third-party-labour-[id]-edit': {
    ...labour,
    label: 'Edit',
    sidebarHidden: true,
  },

  'third-party-sub-contracts': {
    label: 'Sub-Contracts',
    icon: ClipboardList,
    order: 2,
  },
  'third-party-sub-contracts-new': {
    ...subContractWrite,
    label: 'New Sub-Contract',
    sidebarHidden: true,
  },
  'third-party-sub-contracts-[id]': {
    label: 'Sub-Contract',
    sidebarHidden: true,
  },
  'third-party-sub-contracts-[id]-edit': {
    ...subContractWrite,
    label: 'Edit',
    sidebarHidden: true,
  },

  'third-party-vendors': {
    ...vendorRead,
    label: 'Vendors',
    icon: Package,
    order: 3,
  },
  'third-party-vendors-new': {
    ...vendorWrite,
    label: 'New Vendor',
    sidebarHidden: true,
  },
  'third-party-vendors-[id]': {
    ...vendorRead,
    label: 'Vendor',
    sidebarHidden: true,
  },
  'third-party-vendors-[id]-edit': {
    ...vendorWrite,
    label: 'Edit',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
