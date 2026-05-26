/**
 * Parses a raw value as a positive integer id.
 *
 * Rejects: null, undefined, blank/whitespace strings, non-finite values,
 * non-integers, zero, and negative numbers.
 *
 * @param raw     - The raw value from a JSON payload (json.id, json.projectId, etc.)
 * @param context - Caller label used in the error message, e.g. "parseUser.id"
 */
export function parsePositiveInt(raw: unknown, context: string): number {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) {
    throw new TypeError(
      `${context}: expected a non-empty numeric value, got ${JSON.stringify(raw)}`
    );
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new TypeError(
      `${context}: expected a positive integer, got ${JSON.stringify(raw)} (parsed as ${n})`
    );
  }
  return n;
}
