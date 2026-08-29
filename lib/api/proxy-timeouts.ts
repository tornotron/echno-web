/**
 * How long the BFF proxy waits for the backend on a given request.
 *
 * This lives beside the route rather than inside it because a Next.js route
 * module may only export its HTTP handlers, and the policy is worth testing on
 * its own.
 */

/** What an ordinary request gets. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** File uploads, which are slow for reasons that have nothing to do with the backend. */
export const UPLOAD_TIMEOUT_MS = 120_000;

/**
 * Endpoints that cannot finish inside the default budget, named one by one
 * rather than given a blanket raise, so that a genuinely stuck request on any
 * other endpoint still fails fast.
 *
 * Empty, and that is the point. The one entry was compliance generation, which
 * waited on an external AI model inside the request and needed 55 seconds. No
 * budget could have kept working: the run outgrows the 60 seconds the reverse
 * proxy in front of the site allows an upstream response to take, once a
 * jurisdiction has about forty rules. Generation is a queued job now, so
 * starting one costs an insert and polling one costs a single-row read, and
 * both fit the default with room to spare. The mechanism stays for whatever
 * needs it next; raising a budget is not what it needed.
 *
 * A Map rather than an object literal, so a request path that happens to name
 * an inherited object property cannot be mistaken for a configured timeout.
 */
const SLOW_ENDPOINT_TIMEOUTS_MS = new Map<string, number>();

/**
 * The waiting budget for one proxied request.
 *
 * @param targetPath - Backend path, without the `/api/v1` prefix, as the route
 *   assembles it from the caught path segments.
 * @param isMultipart - Whether the request carries a `multipart/form-data` body.
 */
export function proxyTimeoutMs(
  targetPath: string,
  isMultipart: boolean
): number {
  if (isMultipart) {
    return UPLOAD_TIMEOUT_MS;
  }
  return SLOW_ENDPOINT_TIMEOUTS_MS.get(targetPath) ?? REQUEST_TIMEOUT_MS;
}
