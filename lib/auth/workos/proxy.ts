import {
  applyResponseHeaders,
  partitionAuthkitHeaders,
} from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

import type { ProxyHandler } from '@/lib/auth/proxy-handler';
import {
  readWorkosRequestSession,
  sessionError,
} from '@/lib/auth/workos/session';

/**
 * The proxy under WorkOS: `authkit` runs first, the app's own routing (`proxy.ts`) decides what
 * happens, and whatever response that produces carries the library's headers.
 *
 * Two kinds of header come out of `authkit`, and they go to different places. Its internal ones
 * (`x-workos-session` and friends) ride on the forwarded request, where `withAuth()` reads them,
 * after any the browser sent under the same names have been dropped, since a forged
 * `x-workos-session` would otherwise be believed. Its `Set-Cookie` and cache headers go on the
 * response, so a refresh made here reaches the browser. The library's own `partitionAuthkitHeaders`
 * does that split, so this module does not repeat its rules.
 */
export async function runWorkosProxy(
  request: NextRequest,
  handler: ProxyHandler
): Promise<NextResponse> {
  const { state, authkitHeaders } = await readWorkosRequestSession(
    request,
    'page'
  );
  const { requestHeaders, responseHeaders } = partitionAuthkitHeaders(
    request,
    authkitHeaders
  );

  return handler(
    request,
    {
      signedIn: state.kind === 'active',
      error: sessionError(state),
    },
    {
      next(extraRequestHeaders) {
        const forwarded = new Headers(requestHeaders);
        for (const [name, value] of Object.entries(extraRequestHeaders)) {
          forwarded.set(name, value);
        }
        return applyResponseHeaders(
          NextResponse.next({ request: { headers: forwarded } }),
          responseHeaders
        );
      },
      redirect(url) {
        return applyResponseHeaders(
          NextResponse.redirect(url),
          responseHeaders
        );
      },
    }
  );
}
