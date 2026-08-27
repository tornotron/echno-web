import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionTokens,
  hasSessionCookie,
} from '@/lib/auth/get-session-tokens';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';
import { isAccessTokenExpired } from '@/lib/auth/token-refresh-schedule';
import { logger } from '@/lib/logger';

// Server-side only env var (not exposed to client)
const BACKEND_URL = process.env.BACKEND_API_URL;
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds
const UPLOAD_TIMEOUT_MS = 120_000; // 2 minutes for file uploads

// Headers to forward from client request
const FORWARDED_HEADERS = [
  'accept',
  'accept-language',
  'x-request-id',
] as const;

// Keys to redact from logged response bodies
const SENSITIVE_KEYS = [
  'email',
  'name',
  'ssn',
  'password',
  'stack',
  'errorMessage',
] as const;

const MAX_LOG_BODY_LENGTH = 1000;

/**
 * Sanitizes response body for logging by redacting sensitive fields
 * and truncating long content to prevent logging PII or excessive data.
 */
function sanitizeResponseBody(data: string): string {
  try {
    const parsed = JSON.parse(data);
    const sanitized = redactSensitiveFields(parsed);
    const json = JSON.stringify(sanitized);
    if (json.length > MAX_LOG_BODY_LENGTH) {
      return json.slice(0, Math.max(0, MAX_LOG_BODY_LENGTH)) + '…(truncated)';
    }
    return json;
  } catch {
    // Not JSON, truncate the string
    if (data.length > MAX_LOG_BODY_LENGTH) {
      return data.slice(0, Math.max(0, MAX_LOG_BODY_LENGTH)) + '…(truncated)';
    }
    return data;
  }
}

/**
 * Recursively redacts sensitive fields from an object
 */
function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveFields(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      result[key] = SENSITIVE_KEYS.some((sensitive) =>
        lowerKey.includes(sensitive)
      )
        ? '[REDACTED]'
        : redactSensitiveFields(value);
    }
    return result;
  }

  return obj;
}

/**
 * proxyRequest
 *
 * Generic server-side proxy that forwards incoming Next.js API requests
 * to an internal backend API. Responsible for:
 * - forwarding a small, safe set of client headers
 * - attaching server-side authorization tokens when available
 * - applying a request timeout and translating errors into appropriate
 *   HTTP responses
 *
 * This function is intentionally minimal: it forwards body and headers
 * and returns the backend response as-is (status and content-type).
 */
async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  if (!BACKEND_URL) {
    logger.error('Backend API URL not configured');
    return NextResponse.json(
      { error: 'Backend API URL not configured' },
      { status: 500 }
    );
  }

  const { path } = await params;

  // Pull access token from the encrypted JWT cookie server-side. The token is
  // never exposed to the browser — `getSessionTokens` decrypts the cookie that
  // rode in with this request and gives us the access token to forward upstream.
  const tokens = await getSessionTokens();

  // getSessionTokens skips the NextAuth `jwt()` callback (which is where
  // revocation is normally checked) — so we must check explicitly here.
  // Revoked sessions can still hold a valid-looking cookie until it expires;
  // this enforces logout-effective-immediately on the BFF surface.
  //
  // It answers with the same code as every other ended session below. A
  // revocation is a distinct thing and the log line says so, but the client has
  // one recovery path and it keys on one string, so a body only this branch
  // produced would be a body nothing reads.
  if (tokens?.sessionId && isSessionRevoked(tokens.sessionId)) {
    logger.warn('BFF: rejecting request for revoked session', {
      sessionId: tokens.sessionId.slice(0, 10) + '...',
    });
    return NextResponse.json(
      { error: SESSION_TOKEN_EXPIRED_ERROR },
      { status: 401 }
    );
  }

  // Same reason the revocation check lives here: without the `jwt()` callback
  // nothing repairs the cookie, so whatever state the session was left in is
  // still sitting in it. Three shapes arrive that way and they all mean the
  // same thing to the caller, so they get the same answer:
  //
  //   - the access token lapsed while the user sat on one page
  //   - the cookie decoded but the server had already marked the session
  //     finished, which the `error` field records
  //   - the cookie is present and no longer decodes at all, so there are no
  //     tokens to read
  //
  // Forwarding any of them buys a generic rejection from the backend with an
  // empty body, which is indistinguishable from that endpoint refusing this
  // particular call. Answering with the machine-readable code instead is what
  // lets `lib/api/api-client.ts` recognise a finished session and recover.
  //
  // A request carrying no session cookie at all is deliberately not in that
  // list. It is an ordinary anonymous call, and which endpoints accept one is
  // the backend's judgement to make, not this proxy's.
  const isSessionUnusable = tokens
    ? Boolean(tokens.error) || isAccessTokenExpired(tokens.expiresAt, Date.now())
    : await hasSessionCookie();

  if (isSessionUnusable) {
    logger.warn('BFF: rejecting request for a session that has ended', {
      sessionId: tokens?.sessionId
        ? tokens.sessionId.slice(0, 10) + '...'
        : undefined,
      reason: tokens?.error ?? (tokens ? 'access token expired' : 'undecodable'),
    });
    return NextResponse.json(
      { error: SESSION_TOKEN_EXPIRED_ERROR },
      { status: 401 }
    );
  }

  const targetPath = path.join('/');
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/${targetPath}${url.search}`;

  // Extract hostname from BACKEND_URL for Host header
  const backendHost = new URL(BACKEND_URL).host;

  // Build headers
  const headers: HeadersInit = {
    Host: backendHost,
  };

  // Forward selected headers from the original request
  for (const headerName of FORWARDED_HEADERS) {
    const value = request.headers.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  }

  // Set Content-Type from request or default to JSON
  const contentType = request.headers.get('content-type');
  headers['Content-Type'] = contentType || 'application/json';

  // Forward the access token if available
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  // Forward organization ID for multi-tenancy
  if (tokens?.defaultOrganizationId) {
    headers['X-Organization-Id'] = tokens.defaultOrganizationId;
  }

  // A server-sent event stream is meant to stay open, so it must not be raced against a
  // request timeout the way a normal call is. The abort controller is still created and still
  // passed, so a stream is torn down if the caller goes away; it is simply never armed.
  const isEventStream = request.headers
    .get('accept')
    ?.includes('text/event-stream');
  const isMultipart = contentType?.includes('multipart/form-data');
  const timeoutMs = isMultipart ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = isEventStream
    ? undefined
    : setTimeout(() => controller.abort(), timeoutMs);

  try {
    logger.debug('Proxying request', {
      method: request.method,
      targetUrl,
      hasAuth: !!tokens?.accessToken,
    });

    // Get request body for non-GET/HEAD requests
    // Use arrayBuffer for binary data (multipart forms) to preserve integrity
    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = isMultipart ? await request.arrayBuffer() : await request.text();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseContentType =
      response.headers.get('Content-Type') || 'application/json';

    // Server-sent events on a successful response: hand the body through as a stream.
    // Reading it with response.text(), which is what every other branch below does, would
    // wait for an end that never comes, so the browser would see nothing at all. A failed
    // handshake is left to the error path below and read like any other failure.
    // X-Accel-Buffering rides along because nginx sets proxy_buffering on for every site at
    // the edge, and both nginx and ingress-nginx honour the header to release one response
    // from that buffer.
    if (
      response.ok &&
      responseContentType.includes('text/event-stream') &&
      response.body
    ) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Text-shaped payloads (JSON, plain text, XML, HTML) can be read as a
    // string; binary payloads such as a rendered PDF must be forwarded as raw
    // bytes, because decoding them through response.text() corrupts the body.
    const isTextResponse = /json|text|xml|html|javascript/i.test(
      responseContentType
    );

    // On error responses, read the body as text so it can be logged and
    // returned regardless of the advertised content type.
    if (!response.ok) {
      const data = await response.text();
      logger.warn('Backend returned error', {
        status: response.status,
        targetUrl,
        body: sanitizeResponseBody(data),
      });
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': responseContentType },
      });
    }

    if (isTextResponse) {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': responseContentType },
      });
    }

    // Binary success response: forward the bytes untouched and preserve the
    // Content-Disposition header so downloads keep their filename.
    const buffer = await response.arrayBuffer();
    const passthroughHeaders: Record<string, string> = {
      'Content-Type': responseContentType,
    };
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      passthroughHeaders['Content-Disposition'] = contentDisposition;
    }
    return new NextResponse(buffer, {
      status: response.status,
      headers: passthroughHeaders,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Request timeout', {
        targetUrl,
        timeoutMs,
      });
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }

    logger.error('Proxy error', { error, targetUrl });
    return NextResponse.json(
      { error: 'Failed to proxy request to backend' },
      { status: 502 }
    );
  }
}

/**
 * HTTP method handlers (Next.js route handlers) that delegate to proxyRequest.
 * Kept intentionally small to match Next.js expectations for route modules.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}
