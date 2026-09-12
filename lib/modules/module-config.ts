/**
 * lib/modules/module-config.ts
 *
 * The declarative contract a feature folder publishes to become a pluggable
 * module (spec `echno-backend/docs/specs/2026-08-26-modular-plugin-architecture.md`
 * section 9.1). Lives in `lib` rather than inside any one feature, so every
 * feature can import the type without a feature-to-feature boundary crossing.
 */

import type {
  ModuleId,
  ModuleNavDescriptor,
} from '@tornotron/echno-core/module/types';

export interface ModuleConfig {
  /** Must match the id the backend registry publishes for this module. */
  id: ModuleId;
  /** Entitlement/plan key gating this module, e.g. `'MODULE_INSPECTIONS'`. */
  entitlementFeatureKey: string;
  /**
   * Nav entries this module declares it contributes. For a module whose
   * pages already exist as filesystem routes (like `inspections` today),
   * the routes' own `RouteMetadata.moduleId` is what actually gates the
   * sidebar (see `nav/access/evaluate.ts`); this array documents the
   * module's nav contract per the spec rather than driving composition,
   * since there is no config-to-nav-tree merge wired up yet.
   */
  nav: ModuleNavDescriptor[];
}
