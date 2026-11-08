import { FileSpreadsheet } from 'lucide-react';
import type { MetadataRegistry } from '../types';

/**
 * Sidebar and breadcrumb metadata for the Document Ingestion module. The
 * `moduleId` hides the entry for an organization the module is not open to;
 * the permission matches `features/document-ingestion/module.config.ts`. The
 * entry sits in the Projects section, where the backend's nav descriptor
 * places "Import from documents".
 */
export const documentIngestionMetadata = {
  'document-ingestion': {
    label: 'Import from documents',
    icon: FileSpreadsheet,
    section: 'projects',
    order: 4,
    breadcrumb: 'Import from documents',
    moduleId: 'document-ingestion',
    access: { permissions: ['document-ingestion:read'] },
  },
  'document-ingestion-[id]': {
    label: 'Package',
    breadcrumb: 'Package',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
