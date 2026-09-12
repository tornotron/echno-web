/**
 * zod 4 probes `new Function("")` before its first object parse to decide
 * whether it may JIT-compile parsers. Under the site CSP (no 'unsafe-eval')
 * the probe throws, is caught, and the browser reports a script-src violation
 * on every page (#426). `lib/zod-jitless` sets `jitless`, which skips the probe.
 *
 * The check stands in for the CSP: a Function constructor that throws on any
 * call, the way the browser's does under the policy. With the flag set, a
 * parse must never reach it.
 */
import { afterEach, beforeEach, expect, test } from 'bun:test';
import { z } from 'zod';
import '@/lib/zod-jitless';

const RealFunction = globalThis.Function;
let constructorCalls = 0;

beforeEach(() => {
  constructorCalls = 0;
  const blocked = function () {
    constructorCalls += 1;
    throw new EvalError('blocked by Content-Security-Policy');
  } as unknown as FunctionConstructor;
  globalThis.Function = blocked;
});

afterEach(() => {
  globalThis.Function = RealFunction;
});

test('zod runs jitless, so no parse touches the Function constructor', () => {
  expect(z.core.globalConfig.jitless).toBe(true);

  const schema = z.object({ id: z.number(), name: z.string() });
  const parsed = schema.parse({ id: 1, name: 'Marina Towers' });

  expect(parsed).toEqual({ id: 1, name: 'Marina Towers' });
  expect(constructorCalls).toBe(0);
});
