import { Handshake, HardHat, ClipboardList, Package } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const thirdPartyMetadata = {
  'third-party': {
    label: 'Third Party',
    icon: Handshake,
    nonInteractive: true,
    section: 'operations',
    order: 9,
  },

  'third-party-labour': {
    label: 'Labour',
    icon: HardHat,
    order: 1,
  },
  'third-party-labour-new': { label: 'New Labour', sidebarHidden: true },
  'third-party-labour-[id]': { label: 'Labour', sidebarHidden: true },
  'third-party-labour-[id]-edit': { label: 'Edit', sidebarHidden: true },

  'third-party-sub-contracts': {
    label: 'Sub-Contracts',
    icon: ClipboardList,
    order: 2,
  },
  'third-party-sub-contracts-new': {
    label: 'New Sub-Contract',
    sidebarHidden: true,
  },
  'third-party-sub-contracts-[id]': {
    label: 'Sub-Contract',
    sidebarHidden: true,
  },
  'third-party-sub-contracts-[id]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },

  'third-party-vendors': {
    label: 'Vendors',
    icon: Package,
    order: 3,
  },
  'third-party-vendors-new': { label: 'New Vendor', sidebarHidden: true },
  'third-party-vendors-[id]': { label: 'Vendor', sidebarHidden: true },
} satisfies MetadataRegistry;
