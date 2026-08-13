// types/inspection/inspection-create.ts
//
// The create-inspection request shape and its serializer are owned by
// @tornotron/echno-core; this module re-exports them so the app keeps a single
// import point.

export type {
  CreateInspectionRequest,
  InspectionCheckItemRequest,
  InspectionDefectRequest,
} from '@tornotron/echno-core/inspection/types';
export { createInspectionToJson } from '@tornotron/echno-core/inspection/types';
