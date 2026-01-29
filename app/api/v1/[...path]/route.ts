import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

// Server-side only env var (not exposed to client)
const BACKEND_URL = process.env.BACKEND_API_URL;
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

// Headers to forward from client request
const FORWARDED_HEADERS = [
  'accept',
  'accept-language',
  'x-request-id',
] as const;

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

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
      const isMultipart = contentType?.includes('multipart/form-data');
      // For multipart, pass as ArrayBuffer to preserve binary data
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
        timeoutMs: REQUEST_TIMEOUT_MS,
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
