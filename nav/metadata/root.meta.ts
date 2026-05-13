import { Home } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const rootMetadata = {
  dashboard: {
    label: 'Home',
    icon: Home,
    order: 0,
    breadcrumbHidden: true,
  },
} satisfies MetadataRegistry;
