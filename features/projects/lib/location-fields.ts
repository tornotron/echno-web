/**
 * How a blank optional location box is put on the wire.
 *
 * Create and edit are deliberately not the same, because the API reads a
 * missing key differently in each case, and getting it wrong is silent:
 *
 * - On create, a missing key means "not recorded", which is exactly what a
 *   blank box means. The key is omitted.
 * - On patch, a missing key means "leave unchanged". Omitting a cleared box
 *   would make it impossible to ever remove a city, state or PIN code once one
 *   had been saved. The key is sent as an empty string, which the API
 *   normalises to null and stores as "not recorded".
 *
 * Both trim first. The API trims too, so this is about not putting whitespace
 * on the wire rather than about what ends up stored.
 */

/** The value to send on create, or undefined to leave the key out. */
export function optionalOnCreate(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * The value to send on patch. Always a string, never undefined: an empty one
 * is how the field gets cleared.
 */
export function optionalOnUpdate(value: string): string {
  return value.trim();
}
