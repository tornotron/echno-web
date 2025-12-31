/**
 * NextAuth Cookie Management Utilities
 *
 * Centralized cookie handling for authentication
 */

import { NextResponse } from 'next/server';

/**
 * List of all NextAuth cookies that need to be cleared on logout
 */
export const NEXTAUTH_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
] as const;

/**
 * Delete all NextAuth cookies from a response
 *
 * @param response - The NextResponse to modify
 * @returns The modified response with cookies deleted
 *
 * @example
 * ```ts
 * const response = NextResponse.next();
 * deleteNextAuthCookies(response);
 * return response;
 * ```
 */
export function deleteNextAuthCookies(response: NextResponse): NextResponse {
  for (const cookie of NEXTAUTH_COOKIES) {
    response.cookies.delete(cookie);
  }
  return response;
}

/**
 * Create a response with all NextAuth cookies deleted
 *
 * @param baseResponse - Optional base response (defaults to NextResponse.next())
 * @returns Response with cookies cleared
 *
 * @example
 * ```ts
 * // Simple usage
 * return createResponseWithoutCookies();
 *
 * // With custom response
 * const redirect = NextResponse.redirect(new URL('/login', req.url));
 * return createResponseWithoutCookies(redirect);
 * ```
 */
export function createResponseWithoutCookies(
  baseResponse?: NextResponse
): NextResponse {
  const response = baseResponse ?? NextResponse.next();
  return deleteNextAuthCookies(response);
}
