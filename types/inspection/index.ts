export * from './inspection-enums';
export * from './inspection-check-item';
export * from './inspection-defect';
export * from './inspection';
export * from './inspection-create';
export * from './inspection-update';
export * from './checklist-schema';
export * from './checklist-engine';
export * from './template-schema-adapter';

// The NCR and checklist-template contracts moved into @tornotron/echno-core in
// v2.1.0. They are surfaced from here the same way the Inspection entity is, so
// the app keeps one import point for the inspection domain and there is exactly
// one declaration of each enum rather than a web copy shadowing core's.
export type {
  Ncr,
  NcrAction,
  CreateNcrRequest,
  AssignNcrRequest,
  NcrRemarksRequest,
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistTemplateItemRequest,
  ChecklistTemplateRequest,
  StarterChecklistTemplate,
} from '@tornotron/echno-core/inspection/types';

export {
  parseNcr,
  parseNcrStatus,
  parseNcrType,
  createNcrToJson,
  assignNcrToJson,
  ncrRemarksToJson,
  availableNcrActions,
  ncrActionLabels,
  isNcrOverdue,
  ncrDaysOverdue,
  SETTLED_NCR_STATUSES,
  parseChecklistTemplate,
  parseChecklistTemplateItem,
  parseStarterChecklistTemplate,
  checklistTemplateToJson,
} from '@tornotron/echno-core/inspection/types';
