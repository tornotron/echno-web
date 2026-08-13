// types/inspection/inspection.ts
//
// The Inspection entity is owned by @tornotron/echno-core; this module
// re-exports the type and its parser so the app keeps a single import point.

export type { Inspection } from '@tornotron/echno-core/inspection/types';
export { parseInspection } from '@tornotron/echno-core/inspection/types';
