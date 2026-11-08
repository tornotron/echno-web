import { NextResponse, type NextRequest } from 'next/server';

import {
  type BffCaller,
  applyAuthResponseHeaders,
} from '@/lib/auth/bff-caller';
import { SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';
import {
  readWorkosRequestSession,
  responseHeadersFrom,
} from '@/lib/auth/workos/session';
import { logger } from '@/lib/logger';

/**
 * The BFF's caller under WorkOS.
 *
 * The answers match the Keycloak ones: no session cookie is an anonymous call and goes upstream
 * without a bearer; a cookie that cannot be used (idle past the BFF's deadline, no activity
 * record for this session, or a session WorkOS no longer refreshes) is refused with the code the
 * API client recovers from; anything else goes upstream with the access token, which the library
 * has refreshed first when it was close to expiry.
 */
export async function resolveWorkosBffCaller(
  request: NextRequest
): Promise<BffCaller> {
  const { state, authkitHeaders } = await readWorkosRequestSession(
    request,
    'bff'
  );
  const responseHeaders = responseHeadersFrom(request, authkitHeaders);

  if (state.kind === 'ended') {
    logger.warn('BFF: rejecting request for a session that has ended', {
      sessionId: state.sessionId
        ? state.sessionId.slice(0, 10) + '...'
        : undefined,
      reason: state.reason,
    });
    const refusal = NextResponse.json(
      { error: SESSION_TOKEN_EXPIRED_ERROR },
      { status: 401 }
    );
    applyAuthResponseHeaders(refusal, responseHeaders);
    return { refusal };
  }

  if (state.kind === 'anonymous') {
    return { responseHeaders };
  }

  return {
    accessToken: state.accessToken,
    organizationId: state.activity.org,
    responseHeaders,
  };
}
