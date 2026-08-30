/**
 * The invoice listing's pager clamp.
 *
 * The implementation moved to `@/lib/paging` when the payables listing needed
 * the same rule; this re-export keeps the feature's own import path.
 */
export { clampPageNo } from '@/lib/paging';
