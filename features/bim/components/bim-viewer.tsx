'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/shadcn/skeleton';
import type { BimViewerShellProps } from './bim-viewer-shell';

/**
 * Client-only entry to the viewer. The shell itself is rendered on the client
 * only (three.js needs a window), and the shell in turn imports the engine on
 * demand, so neither three nor the components library reaches the main chunk.
 */
export const BimViewer = dynamic<BimViewerShellProps>(
  () => import('./bim-viewer-shell').then((m) => m.BimViewerShell),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[480px] w-full" />,
  }
);
