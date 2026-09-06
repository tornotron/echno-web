import type { KeyboardEvent } from 'react';

/**
 * Characters that `<input type="number">` accepts as exponent (`e`/`E`) or
 * sign (`+`/`-`) notation. They let a user type values like `1e5` or `+3`
 * into cost, quantity and threshold fields, which is never wanted here.
 */
const BLOCKED_NUMBER_KEYS = new Set(['e', 'E', '+', '-']);

/**
 * The same list without the sign characters, for fields whose valid range
 * genuinely crosses zero. Inspection checklists are the case that needs it:
 * a numeric element carries a `validation.min` that may be negative, so the
 * template author has to be able to type `-5` into the bound and the
 * inspector has to be able to answer with a negative reading. Exponent
 * notation stays blocked, since `1e5` is never a wanted keystroke.
 */
const BLOCKED_EXPONENT_KEYS = new Set(['e', 'E']);

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
 *
 * Pass `allowSigned` for a field whose range crosses zero. That keeps `e`/`E`
 * blocked and lets `+`/`-` through.
 */
export function blockNonNumericKeys(
  event: KeyboardEvent<HTMLInputElement>,
  allowSigned = false
): void {
  const blocked = allowSigned ? BLOCKED_EXPONENT_KEYS : BLOCKED_NUMBER_KEYS;
  if (blocked.has(event.key)) {
    event.preventDefault();
  }
}
