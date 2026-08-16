/**
 * CSP Violation Report Endpoint
 *
 * Collects Content-Security-Policy violation reports sent by browsers via the
 * `report-uri` directive of the report-only policy (see `next.config.ts`).
 * Reports are logged server-side so the real asset / connect / script hosts the
 * app uses can be measured before an *enforcing* CSP is turned on.
 *
 * Public endpoint (browsers post here without credentials). It only logs and
 * always returns 204.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // `report-uri` sends `{ "csp-report": {...} }`; `report-to` sends an array of
    // reports. Log whichever shape arrived.
    const report =
      body && typeof body === 'object' && 'csp-report' in body
        ? (body as Record<string, unknown>)['csp-report']
        : body;
    logger.warn('CSP violation reported', { report });
  } catch {
    // Malformed or empty report body — nothing to log.
  }
  return new NextResponse(null, { status: 204 });
}
