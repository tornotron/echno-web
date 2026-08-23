import type { KeyboardEvent } from 'react';

/**
 * Characters that `<input type="number">` accepts as exponent (`e`/`E`) or
 * sign (`+`/`-`) notation. They let a user type values like `1e5` or `+3`
 * into cost, quantity and threshold fields, which is never wanted here.
 */
const BLOCKED_NUMBER_KEYS = new Set(['e', 'E', '+', '-']);

/**
 * blockNonNumericKeys
 *
 * Keydown guard for numeric inputs. A native `<input type="number">` treats
 * `e`/`E` as exponential notation and `+`/`-` as a sign, so those keystrokes
 * pass straight through. This prevents exactly those four keys and leaves
 * everything else untouched: digits, the decimal point, and every editing or
 * navigation key (Backspace, Delete, Tab, arrows, Enter, copy/paste shortcuts)
 * still work, because only single-character key values are ever blocked.
 *
 * It only calls `preventDefault`; it never reads or rewrites the field value,
 * so numeric parsing, validation and submit handling are unaffected.
 */
export function blockNonNumericKeys(event: KeyboardEvent<HTMLInputElement>): void {
  if (BLOCKED_NUMBER_KEYS.has(event.key)) {
    event.preventDefault();
  }
}
