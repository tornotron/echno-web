import { Home } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const rootMetadata = {
  dashboard: {
    label: 'Home',
    icon: Home,
    section: 'overview',
    order: 0,
  },
} satisfies MetadataRegistry;
