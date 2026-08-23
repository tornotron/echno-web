/**
 * Attachment entity-type strings understood by the backend's presign/register
 * endpoints (echno-backend PR #311). The string is the storage bucket's
 * top-level namespace for the object, so it must match the backend enum
 * exactly.
 *
 * The collection types below use the PLURAL forms specified by the
 * presign/register contract (PR #311), verified against the backend
 * controllers' `entityType` defaults: `ISSUE_ATTACHMENTS` (IssueController /
 * IssueControllerWeb), `TASK_ATTACHMENTS` (TaskControllerWeb) and
 * `PROJECT_ATTACHMENTS` (ProjectControllerWeb). The single-object types stay
 * singular: `ORGANIZATION_LOGO`, `USER_PROFILE_PICTURE`, `USER_CV`. echno-core's
 * older download-flow doc examples reference singular `ISSUE_ATTACHMENT` /
 * `TASK_ATTACHMENT`; those are the legacy GET-by-entityType examples, not the
 * register enum.
 */
export const AttachmentEntityType = {
  ISSUE_ATTACHMENTS: 'ISSUE_ATTACHMENTS',
  TASK_ATTACHMENTS: 'TASK_ATTACHMENTS',
  PROJECT_ATTACHMENTS: 'PROJECT_ATTACHMENTS',
  ORGANIZATION_LOGO: 'ORGANIZATION_LOGO',
  USER_PROFILE_PICTURE: 'USER_PROFILE_PICTURE',
  USER_CV: 'USER_CV',
} as const;

export type AttachmentEntityType =
  (typeof AttachmentEntityType)[keyof typeof AttachmentEntityType];
