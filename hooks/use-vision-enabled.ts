'use client';

import { useEnabledModuleIds } from './use-enabled-module-ids';

/** The backend's module id for computer vision (`VisionModule.ID`). */
export const VISION_MODULE_ID = 'vision';

/**
 * True only once the enabled-module set is known and holds `vision`. While
 * it loads, or when the fetch failed, this is false: a vision endpoint
 * answers 404 for an organization without the module, so the safe default
 * is to show nothing and call nothing.
 */
export function useVisionEnabled(): boolean {
  const { moduleIds } = useEnabledModuleIds();
  return moduleIds?.has(VISION_MODULE_ID) === true;
}
