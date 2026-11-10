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

/** Raise a project risk from a contract term or an obligation: the risk register's own manage gate. */
export const INGEST_RISK_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
};

/**
 * Copy ITP rows into checklist templates: the inspections module's define
 * gate. The backend also lets a qa-engineer copy, a role the web's list does
 * not have yet, so only the system admin sees the button here.
 */
export const INGEST_CHECKLIST_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN],
};

/** Set or clear a person's judgement on a qualification requirement: `document-ingestion:apply`. */
export const INGEST_QUALIFICATION_ACCESS: AccessConfig = INGEST_APPLY_ACCESS;
