import type { NextResponse } from 'next/server';

/**
 * What the BFF (`app/api/v1/[...path]/route.ts`) needs to know about whoever sent a request,
 * whichever provider signed them in.
 */
export interface BffForward {
  /** The bearer to send upstream, or undefined for an anonymous call. */
  accessToken?: string;
  /** Sent as `X-Organization-Id`. */
  organizationId?: string;
  /** Headers for the browser, such as a refreshed session cookie. */
  responseHeaders?: Headers;
}

/** Either a caller to forward for, or the answer to give instead. */
export type BffCaller = BffForward | { refusal: NextResponse };

/**
 * Copies `headers` onto `response`. Each `Set-Cookie` is appended, since a response can carry
 * several; anything else replaces what was there.
 */
export function applyAuthResponseHeaders(
  response: Response,
  headers: Headers
): void {
  for (const [name, value] of headers) {
    if (name.toLowerCase() === 'set-cookie') {
      response.headers.append(name, value);
    } else {
      response.headers.set(name, value);
    }
  }
}
