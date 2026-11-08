/**
 * validators/index
 *
 * Central re-export of all field validators used across the application.
 * Import from this module to get a stable, intention-revealing API for
 * form validation helpers (e.g. `import { email, required } from '@/lib/validators'`).
 */
export * from './common';
export * from './name';
export * from './email';
export * from './phone';
export * from './url';
export * from './custom';
