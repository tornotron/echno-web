import { ApiError } from '@tornotron/echno-core';

/** Shown wherever checkout is unavailable because the backend runs with no payment provider. */
export const BILLING_NOT_CONFIGURED_MESSAGE =
  'Online payments are not set up for this environment yet. Contact your administrator to change plans.';

/** Shown when the subscription read is refused: billing is a system-admin surface on the backend. */
export const BILLING_ADMIN_ONLY_MESSAGE = 'Billing is managed by your organization admin.';

/**
 * The backend answers a checkout under `echno.billing.provider=none` with a 409
 * whose problem title is "Billing Not Configured" (`BillingNotConfiguredException`).
 * The title is the contract; the message text is matched as a fallback for a
 * proxy that drops the title.
 */
export function isBillingNotConfiguredError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false;
  if (error.title?.toLowerCase() === 'billing not configured') return true;
  return /no billing provider is configured|billing not configured/i.test(error.message);
}

/** True for a refused read or write: the caller is not the organization's system admin. */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

/** The text a checkout error alert shows; known backend problems get the app's own wording. */
export function checkoutErrorMessage(error: unknown, fallback: string): string {
  if (isBillingNotConfiguredError(error)) return BILLING_NOT_CONFIGURED_MESSAGE;
  return error instanceof Error ? error.message : fallback;
}
