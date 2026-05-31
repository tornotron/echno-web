// Canonical location: lib/query/retry.ts
// This shim exists during the gradual migration defined in
// docs/tanstack-query-optimization-action-plan.md.
// Each hook module updates its import to @/lib/query/retry when touched.
// Remove this file once all imports have been migrated.
export { shouldRetry } from '@/lib/query/retry';
