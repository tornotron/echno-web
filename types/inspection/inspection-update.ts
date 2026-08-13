// types/inspection/inspection-update.ts
//
// The update-inspection request shape and its serializer are owned by
// @tornotron/echno-core; this module re-exports them so the app keeps a single
// import point.

export type { UpdateInspectionRequest } from '@tornotron/echno-core/inspection/types';
export { updateInspectionToJson } from '@tornotron/echno-core/inspection/types';
