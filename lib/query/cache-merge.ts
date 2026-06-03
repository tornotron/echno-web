/**
 * Cache merge helpers for mutation responses that return partial DTOs.
 *
 * Many backend mutation endpoints return a "simple" DTO (e.g. `ProjectSimpleDto`,
 * `TaskSimpleDto`) that omits nested collections — or a generic `ResponseDto`
 * ack that contains no domain data at all. Using `setQueryData(detail, response)`
 * directly with such a response silently drops nested fields from the cache
 * (attachments, members, subtasks, comments, …) until the next refetch.
 *
 * `mergePreservingNested` is the canonical replacement: scalar fields from the
 * response overwrite the cache; for the `preserveKeys` we keep the cached value
 * only when the response **omits** that field — i.e. the incoming value is
 * `null` or `undefined`.
 *
 * Empty arrays (`[]`) are treated as intentional, not as "absent": the backend
 * is telling us the collection is empty now, so we must surface that in the
 * cache. If a future endpoint actually uses `[]` to mean "omitted", that's a
 * backend contract bug — fix it on the backend rather than on this helper.
 *
 * Usage pattern (with invalidate as the safety net):
 *
 *   queryClient.setQueryData(detail(id), (old) =>
 *     old
 *       ? mergePreservingNested(old, response, ['attachments', 'members', 'tasks'])
 *       : response,
 *   );
 *   queryClient.invalidateQueries({ queryKey: detail(id) });
 */
export function mergePreservingNested<T extends object>(
  cached: T,
  partial: Partial<T>,
  preserveKeys: ReadonlyArray<keyof T>
): T {
  const merged = { ...cached, ...partial };
  for (const key of preserveKeys) {
    const incoming = (partial as Record<keyof T, unknown>)[key];
    if (incoming == null) {
      merged[key] = cached[key];
    }
  }
  return merged;
}
