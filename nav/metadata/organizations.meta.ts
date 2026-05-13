import { Building } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const organizationsMetadata = {
  organizations: {
    label: 'Organizations',
    icon: Building,
    sidebarHidden: true,
  },
  'organizations-join': {
    label: 'Join Organization',
    breadcrumb: 'Join',
    sidebarHidden: true,
  },
  'organizations-new': { label: 'New Organization', sidebarHidden: true },
  'organizations-[id]': { label: 'Organization', sidebarHidden: true },
  'organizations-[id]-edit': { label: 'Edit', sidebarHidden: true },
} satisfies MetadataRegistry;
