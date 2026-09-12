import { z } from 'zod';

/**
 * Turns off zod 4's JIT-compiled parsers.
 *
 * Without this, zod's first object parse in a page probes `new Function("")` to
 * see whether it may compile a fast path. The site CSP (`lib/csp.ts`) allows
 * 'wasm-unsafe-eval' and not 'unsafe-eval', so the probe throws, zod catches it
 * and uses the interpreted parser, and the browser files a script-src violation
 * for the attempt on every page load (issue #426). With `jitless` set the probe
 * is skipped entirely. The interpreted path is what ran in production anyway,
 * so this changes the noise, not the behaviour.
 *
 * Imported from `instrumentation-client.ts`, which Next runs before any other
 * client code, so the flag is set before the first parse.
 */
z.config({ jitless: true });
