/**
 * Razorpay Checkout.js, loaded on demand.
 *
 * The script is fetched from `checkout.razorpay.com` (allow-listed in
 * `lib/csp.ts`) the first time a checkout starts, never at page load: most
 * sessions never buy anything and the script is a third-party download. The
 * factory is injectable so the checkout flow can be exercised in tests with a
 * fake handler that never touches the network.
 */
import type { CheckoutSession } from '@tornotron/echno-core/billing/types';

export const RAZORPAY_CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** What Checkout.js hands the success handler. Field names are Razorpay's. */
export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
}

/** The subset of Checkout.js options this flow uses. */
export interface RazorpayOptions {
  key: string;
  subscription_id?: string;
  order_id?: string;
  name: string;
  description?: string;
  currency?: string;
  /** In paise; ignored by Razorpay for subscriptions, sent for orders. */
  amount?: number;
  prefill?: { email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
  on?(event: 'payment.failed', handler: (response: unknown) => void): void;
}

/** Builds a checkout instance from options. `window.Razorpay` in the browser; a fake in tests. */
export type RazorpayFactory = (options: RazorpayOptions) => RazorpayInstance;

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

/** `window.Razorpay` once Checkout.js has run, read without widening the global type. */
function installedRazorpay(): RazorpayConstructor | undefined {
  return (globalThis as { Razorpay?: RazorpayConstructor }).Razorpay;
}

let scriptPromise: Promise<void> | null = null;

/**
 * Injects Checkout.js once and resolves when it is ready. A second call
 * while the first is in flight shares the same promise; a failed load is
 * forgotten so the next attempt retries.
 */
export function loadRazorpayCheckout(doc: Document = document): Promise<void> {
  if (installedRazorpay()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Razorpay Checkout could not be loaded'));
    });
    doc.head.append(script);
  });
  return scriptPromise;
}

/** The browser factory: loads the script if needed, then constructs `window.Razorpay`. */
export async function browserRazorpayFactory(): Promise<RazorpayFactory> {
  await loadRazorpayCheckout();
  const ctor = installedRazorpay();
  if (!ctor) throw new Error('Razorpay Checkout did not initialise');
  return (options) => new ctor(options);
}

/** Maps a checkout session onto Checkout.js options. */
export function checkoutOptionsFor(
  session: CheckoutSession,
  planName: string,
  handler: RazorpayOptions['handler'],
  onDismiss?: () => void
): RazorpayOptions {
  const options: RazorpayOptions = {
    key: session.keyId,
    name: 'Echno',
    description: session.recurring
      ? `${planName}, ${session.billingPeriod === 'ANNUAL' ? 'yearly' : 'monthly'}`
      : planName,
    currency: session.currency,
    prefill: {
      email: session.customerEmail ?? undefined,
      contact: session.customerContact ?? undefined,
    },
    notes: { planCode: session.planCode },
    handler,
    modal: { ondismiss: onDismiss },
  };
  if (session.providerSubscriptionId) {
    options.subscription_id = session.providerSubscriptionId;
  } else if (session.providerOrderId) {
    options.order_id = session.providerOrderId;
    options.amount = session.amountPaise;
  }
  return options;
}
