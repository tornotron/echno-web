export * from './inspection-keys';
export * from './use-inspections';
export * from './use-inspection-mutations';
export * from './use-compliance-generation';
export * from './ncr-keys';
export * from './use-ncrs';
export * from './use-checklist-templates';
export * from './use-responsible-name';

// Reinspection attempts and the event log come from core (v8.7.0) and are
// surfaced here so the feature has one import point for the inspection
// domain and the screen tests can stub them alongside the NCR hooks. The
// core key factories for `['ncrs']` and `['inspections']` are deliberately
// not re-exported: the web ones above own those namespaces.
export {
  inspectionEventKeys,
  reinspectionKeys,
  useInspectionEventQuery,
  useInspectionEvents,
  useNcrEvents,
  useRecordReinspectionOutcome,
  useReinspection,
  useReinspectionsByNcr,
  useScheduleReinspectionForDefect,
  useScheduleReinspectionForNcr,
} from '@tornotron/echno-core/inspection/hooks';
