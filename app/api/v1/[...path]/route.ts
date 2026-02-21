import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
    return JSON.stringify(sanitized);
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
  const session = await auth();

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
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  // Forward organization ID for multi-tenancy
  if (session?.user?.defaultOrganizationId) {
    headers['X-Organization-Id'] = session.user.defaultOrganizationId;
  }

  // Use longer timeout for file uploads
  const isMultipart = contentType?.includes('multipart/form-data');
  const timeoutMs = isMultipart ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logger.debug('Proxying request', {
      method: request.method,
      targetUrl,
      hasAuth: !!session?.accessToken,
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

    const data = await response.text();

    // Log non-2xx responses
    if (!response.ok) {
      logger.warn('Backend returned error', {
        status: response.status,
        targetUrl,
        body: sanitizeResponseBody(data),
      });
    }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') || 'application/json',
      },
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
