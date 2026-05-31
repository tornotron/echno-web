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
 * response overwrite the cache; nested keys are preserved from cache when the
 * response omits them (undefined/null/empty array).
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
    const isEmpty =
      incoming == null || (Array.isArray(incoming) && incoming.length === 0);
    if (isEmpty) {
      merged[key] = cached[key];
    }
  }
  return merged;
}
