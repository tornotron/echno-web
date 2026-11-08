import { OrgRole } from '@tornotron/echno-core/employee/types';
import type { AccessConfig } from '@/nav/access/roles';

/**
 * The org-role gates of the module's write endpoints, mirrored so a screen
 * withholds a button the backend would refuse. The backend stays the judge:
 * every decision it refuses comes back with its own outcome and sentence.
 *
 * Uploading and confirming classes are left ungated here, because the backend
 * also lets a qa-engineer do both and the web's role list has no such role
 * yet; the backend's refusal is shown as it is sent.
 */

/** Accept, edit or reject project fields, milestones and changes: `document-ingestion:review` for these kinds. */
export const INGEST_REVIEW_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
};

/** Write accepted values to live records: `document-ingestion:apply`. */
export const INGEST_APPLY_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
};

/** Turn AI reading on or off and set the monthly limit: `document-ingestion:admin`. */
export const INGEST_ADMIN_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN],
};
