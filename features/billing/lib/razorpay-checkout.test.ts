import { describe, expect, test } from 'bun:test';
import { RAZORPAY_CHECKOUT_SCRIPT, loadRazorpayCheckout } from './razorpay-checkout';

/** A document that records the script instead of fetching it (happy-dom would try the network). */
function fakeDocument() {
  const appended: HTMLScriptElement[] = [];
  const doc = {
    createElement: () => {
      const listeners: Record<string, () => void> = {};
      const el = {
        src: '',
        async: false,
        remove: () => {},
        addEventListener: (name: string, fn: () => void) => {
          listeners[name] = fn;
        },
        fire: (name: string) => listeners[name]?.(),
      };
      return el as unknown as HTMLScriptElement;
    },
    head: { append: (el: HTMLScriptElement) => appended.push(el) },
  } as unknown as Document;
  return { doc, appended };
}

describe('loadRazorpayCheckout', () => {
  test('injects the Checkout.js script from checkout.razorpay.com only when asked, once', async () => {
    const { doc, appended } = fakeDocument();
    expect(appended).toHaveLength(0);
    const first = loadRazorpayCheckout(doc);
    const second = loadRazorpayCheckout(doc);
    expect(second).toBe(first);
    expect(appended).toHaveLength(1);
    expect(appended[0].src).toBe(RAZORPAY_CHECKOUT_SCRIPT);
    expect(appended[0].src).toBe('https://checkout.razorpay.com/v1/checkout.js');
    (appended[0] as unknown as { fire: (n: string) => void }).fire('load');
    await first;
  });
});
