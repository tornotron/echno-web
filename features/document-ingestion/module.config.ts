import type { ModuleConfig } from '@/lib/modules/module-config';

/**
 * The Document Ingestion module's registry contract. The backend keeps the
 * module off for every organization until an operator opens it, and then
 * answers 403 `MODULE_DISABLED` to any organization it is not open to, so an
 * organization without it never sees the sidebar entry or the route
 * (`ModuleGuard` sends a direct visit to 403, and `IngestionGate` renders
 * nothing while the status call refuses).
 *
 * The nav entry here and `nav/metadata/document-ingestion.meta.ts` describe
 * the same route and the same permission; `module.config.test.ts` keeps them
 * in step.
 */
export const documentIngestionModule: ModuleConfig = {
  id: 'document-ingestion',
  entitlementFeatureKey: 'MODULE_DOCUMENT_INGESTION',
  nav: [
    {
      label: 'Import from documents',
      section: 'projects',
      path: '/users/dashboard/document-ingestion',
      icon: 'FileSpreadsheet',
      requiredPermissions: ['document-ingestion:read'],
    },
  ],
};
