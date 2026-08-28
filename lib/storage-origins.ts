/**
 * The object-storage origins this deployment talks to, in the one place that
 * defines them.
 *
 * Attachments are uploaded straight from the browser to the object store with
 * a presigned url, and read back the same way, so the store's origin has to be
 * allow-listed three times over: `connect-src` for the `PUT`, `img-src` for
 * rendering what came back, and `next/image`'s `remotePatterns` for the same
 * images going through the optimizer. Those lists used to be written out
 * separately, and they drifted: `connect-src` followed the environment while
 * `img-src` and `remotePatterns` still named a DigitalOcean Spaces bucket that
 * belonged to a box which no longer exists. An upload then succeeded and the
 * file was simply never displayable.
 *
 * The source is `NEXT_PUBLIC_STORAGE_ORIGIN`, one origin or a comma-separated
 * list. It is read in two different moments and that matters:
 *
 * - `proxy.ts` reads it per request, so the CSP follows the running container's
 *   environment;
 * - `next.config.ts` reads it while building, because `output: 'standalone'`
 *   freezes the image config into the build. The Dockerfile therefore takes it
 *   as a build argument as well as running with it set.
 *
 * Kept free of imports on purpose: `next.config.ts` loads this module before
 * any application code exists, so anything pulled in here would have to build
 * in that context too.
 */

/**
 * Every configured storage origin, as absolute origins (`https://host`).
 *
 * Returns an empty list when the variable is unset. That is a broken
 * deployment rather than a safe default, and the caller in `proxy.ts` says so
 * in the log, but degrading to `'self'` beats failing the build.
 */
export function storageOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_STORAGE_ORIGIN;
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * The same origins expressed as `next/image` remote patterns.
 *
 * An origin that cannot be parsed is dropped rather than thrown on: a typo in
 * one entry of the list should not take the whole application down at boot,
 * and the missing pattern shows up as an image that will not render, which is
 * the same symptom the operator would get from omitting it.
 */
export function storageRemotePatterns(): {
  protocol: 'http' | 'https';
  hostname: string;
  port: string;
  pathname: string;
}[] {
  const patterns = [];
  for (const origin of storageOrigins()) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    patterns.push({
      protocol:
        url.protocol === 'https:' ? ('https' as const) : ('http' as const),
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    });
  }
  return patterns;
}
