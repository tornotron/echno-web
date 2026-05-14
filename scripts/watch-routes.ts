#!/usr/bin/env node
/**
 * scripts/watch-routes.ts
 *
 * Filesystem watcher for route auto-regeneration.
 *
 * Uses chokidar to reliably detect changes inside app/users/dashboard,
 * debounces rapid burst events (folder renames trigger many events),
 * and delegates to generateRoutes() from generate-routes.ts.
 *
 * Run: node --experimental-strip-types scripts/watch-routes.ts
 *   or: pnpm routes:watch
 *
 * Typically started alongside next dev via: pnpm dev
 */

import path from 'node:path';
import chokidar from 'chokidar';
import { generateRoutes } from './generate-routes.ts';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WATCH_DIR = path.resolve(process.cwd(), 'app/users/dashboard');

/**
 * How long to wait after the last filesystem event before regenerating.
 * 200 ms absorbs folder renames, which emit addDir + unlinkDir in rapid succession.
 */
const DEBOUNCE_MS = 200;

/**
 * Patterns chokidar ignores entirely.
 * Critically, nav/generated must be excluded to prevent the watcher from
 * triggering on its own output and creating an infinite regeneration loop.
 */
const IGNORED: (string | RegExp)[] = [
  // Never react to our own output
  /nav[/\\]generated/,
  // Standard exclusions
  /node_modules/,
  /\.next/,
  // Utility folders that are never routes
  /[/\\]_components([/\\]|$)/,
  /[/\\]_hooks([/\\]|$)/,
  /[/\\]_utils([/\\]|$)/,
  /[/\\]_lib([/\\]|$)/,
  /[/\\]_actions([/\\]|$)/,
  // Hidden folders/files
  /(^|[/\\])\../,
];

// ---------------------------------------------------------------------------
// Debounced regeneration
// ---------------------------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let busy = false;
let pendingEvent: string | null = null;
let pendingFilePath: string | null = null;

function scheduleRegeneration(event: string, filePath: string): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(
    () => void runRegeneration(event, filePath),
    DEBOUNCE_MS
  );
}

async function runRegeneration(event: string, filePath: string): Promise<void> {
  if (busy) {
    // Enqueue the most recent event so it runs after the current pass finishes.
    pendingEvent = event;
    pendingFilePath = filePath;
    return;
  }
  busy = true;

  const rel = path.relative(process.cwd(), filePath);
  process.stdout.write(`\n[routes:watch] ${event}: ${rel}\n`);
  process.stdout.write('Regenerating routes...\n');

  try {
    const result = generateRoutes({ silent: true });

    if (result.skipped) {
      process.stdout.write('— No structural changes, skipping write.\n');
    } else {
      const fileWord = result.filesChanged === 1 ? 'file' : 'files';
      process.stdout.write(
        `Routes regenerated (${result.filesChanged} ${fileWord} updated, ${result.routeCount} routes)\n`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Route generation failed: ${message}\n`);
  } finally {
    busy = false;
    if (pendingEvent !== null && pendingFilePath !== null) {
      const nextEvent = pendingEvent;
      const nextFilePath = pendingFilePath;
      pendingEvent = null;
      pendingFilePath = null;
      void runRegeneration(nextEvent, nextFilePath);
    }
  }
}

// ---------------------------------------------------------------------------
// Initial generation + watcher startup
// ---------------------------------------------------------------------------

process.stdout.write('Watching app routes...\n');
process.stdout.write(`   ${WATCH_DIR}\n\n`);

// Always generate once on startup so the watcher launches with fresh output.
generateRoutes();

const watcher = chokidar.watch(WATCH_DIR, {
  ignored: IGNORED,
  persistent: true,
  // Don't fire events for pre-existing files on startup — we already generated above.
  ignoreInitial: true,
  followSymlinks: false,
  // Wait until the file system has settled before firing events.
  // Reduces false positives when editors write files in multiple steps.
  awaitWriteFinish: {
    stabilityThreshold: 80,
    pollInterval: 50,
  },
});

// In Next.js App Router, routes are directories.
// We watch addDir/unlinkDir for route creation/deletion/rename.
// File-level events are ignored — page.tsx existence is not tracked by the scanner.
watcher
  .on('addDir', (p) => scheduleRegeneration('addDir', p))
  .on('unlinkDir', (p) => scheduleRegeneration('unlinkDir', p))
  .on('error', (err) => {
    process.stderr.write(`[routes:watch] Watcher error: ${String(err)}\n`);
  });

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string): void {
  process.stdout.write(
    `\n [routes:watch] Received ${signal}, stopping watcher...\n`
  );
  if (debounceTimer) clearTimeout(debounceTimer);
  watcher
    .close()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
