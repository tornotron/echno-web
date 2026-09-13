/**
 * The Content-Security-Policy `proxy.ts` sets on every document response.
 *
 * The decisions that matter are the ones that keep an injected script from
 * running: a fresh nonce per response, no 'unsafe-inline' or 'unsafe-eval' on
 * script-src, and a report endpoint so a violation is logged rather than only
 * seen by whoever has the console open. #426 was found through that endpoint.
 */
import { expect, test } from 'bun:test';
import { buildCsp } from '@/lib/csp';

function directive(policy: string, name: string): string {
  const found = policy
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));
  if (!found) throw new Error(`policy has no ${name} directive`);
  return found;
}

test('script-src carries a per-response nonce and no unsafe-* source', () => {
  const first = buildCsp();
  const second = buildCsp();

  expect(first.nonce).not.toBe(second.nonce);
  expect(first.nonce.length).toBeGreaterThan(16);

  const scriptSrc = directive(first.policy, 'script-src');
  expect(scriptSrc).toContain(`'nonce-${first.nonce}'`);
  expect(scriptSrc).toContain("'wasm-unsafe-eval'");
  expect(scriptSrc).not.toContain("'unsafe-eval'");
  expect(scriptSrc).not.toContain("'unsafe-inline'");
  expect(scriptSrc).not.toContain("'strict-dynamic'");
});

test('violations are reported and the page cannot be framed', () => {
  const { policy } = buildCsp();
  expect(directive(policy, 'report-uri')).toBe('report-uri /api/csp-report');
  expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'none'");
  expect(directive(policy, 'base-uri')).toBe("base-uri 'self'");
});

test('Razorpay Checkout.js is allowed as a script, a frame and a connect target (#448)', () => {
  const { policy } = buildCsp();
  const scriptSrc = directive(policy, 'script-src');
  expect(scriptSrc).toContain('https://checkout.razorpay.com');
  expect(scriptSrc).not.toContain('https://api.razorpay.com');

  const frameSrc = directive(policy, 'frame-src');
  expect(frameSrc).toContain('https://checkout.razorpay.com');
  expect(frameSrc).toContain('https://api.razorpay.com');
  expect(frameSrc).not.toContain('*');

  const connectSrc = directive(policy, 'connect-src');
  expect(connectSrc).toContain('https://api.razorpay.com');
  expect(connectSrc).toContain("'self'");
});
