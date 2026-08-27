/**
 * Identifiers for the forms that keep a local draft.
 *
 * A form and the page that submits it both need to name the same draft: the
 * form to write it, the page to clear it once the record is saved. Naming it
 * from a constant rather than a string literal in two files is what stops the
 * two drifting apart and leaving a draft behind that is then restored over a
 * completed record.
 *
 * Only the long forms are listed. A draft that reappears on a two-field dialog
 * the user has already forgotten about is a worse experience than no draft, so
 * this list is chosen by how much typing a form represents and is meant to stay
 * short.
 */
export const FORM_DRAFT_IDS = {
  /** Project create and edit. The form that started this. */
  PROJECT: 'project',
  /** Issue create and edit: long description plus task and assignee picking. */
  ISSUE: 'issue',
  /** Task create and edit: description, tags, dates, assignees. */
  TASK: 'task',
  /** Purchase order: header plus priced line items. */
  PURCHASE_ORDER: 'purchase-order',
  /** Material indent: header plus requested line items. */
  INDENT: 'indent',
  /** Goods receipt note: header plus received and rejected quantities. */
  GOODS_RECEIPT: 'goods-receipt',
  /** Site transfer: source, destination and transferred line items. */
  SITE_TRANSFER: 'site-transfer',
} as const;

/** One of the forms that keeps a draft. */
export type FormDraftId = (typeof FORM_DRAFT_IDS)[keyof typeof FORM_DRAFT_IDS];
