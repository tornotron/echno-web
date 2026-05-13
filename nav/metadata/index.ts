/**
 * nav/metadata/index.ts
 *
 * Merges all per-module metadata files into a single MetadataRegistry.
 * Add a new import here whenever you add a new metadata file.
 */

import type { MetadataRegistry } from '../types';

import { rootMetadata } from './root.meta';
import { attendanceMetadata } from './attendance.meta';
import { chatMetadata } from './chat.meta';
import { financeMetadata } from './finance.meta';
import { organizationsMetadata } from './organizations.meta';
import { projectsMetadata } from './projects.meta';
import { resourcesMetadata } from './resources.meta';
import { thirdPartyMetadata } from './third-party.meta';
import { workforceMetadata } from './workforce.meta';
import { miscMetadata } from './misc.meta';

export const metadataRegistry: MetadataRegistry = {
  ...rootMetadata,
  ...attendanceMetadata,
  ...chatMetadata,
  ...financeMetadata,
  ...organizationsMetadata,
  ...projectsMetadata,
  ...resourcesMetadata,
  ...thirdPartyMetadata,
  ...workforceMetadata,
  ...miscMetadata,
};

export { rootMetadata } from './root.meta';
export { attendanceMetadata } from './attendance.meta';
export { chatMetadata } from './chat.meta';
export { financeMetadata } from './finance.meta';
export { organizationsMetadata } from './organizations.meta';
export { projectsMetadata } from './projects.meta';
export { resourcesMetadata } from './resources.meta';
export { thirdPartyMetadata } from './third-party.meta';
export { workforceMetadata } from './workforce.meta';
export { miscMetadata } from './misc.meta';
