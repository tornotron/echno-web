'use client';

import { Loader2, MapPin, MapPinOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  formatCoord,
  LOCATION_ERROR_COPY,
  type LocationState,
} from '../lib/device-location';

/**
 * The one-line location card: a spinner while the browser is asked, the
 * position once it answers, or the failure with the one action that can fix
 * it. Shared by the self-marking dialog and the Mark for Team screen so the
 * two say the same things about the same failures.
 */
export function LocationStatus({
  state,
  onAllow,
  onRetry,
}: {
  state: LocationState;
  onAllow: () => void;
  onRetry: () => void;
}) {
  if (state.status === 'idle' || state.status === 'detecting') {
    return (
      <div className="bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-2.5">
        <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
        <div>
          <p className="text-sm font-medium">Detecting location…</p>
          <p className="text-muted-foreground text-xs">
            Allow location access when prompted
          </p>
        </div>
      </div>
    );
  }
  if (state.status === 'error') {
    const copy = LOCATION_ERROR_COPY[state.kind];
    // 'permission-required' is a step in the flow rather than a fault, so it
    // reads as an amber prompt; everything else has actually failed.
    const isPrompt = state.kind === 'permission-required';
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
          isPrompt
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}
      >
        {isPrompt ? (
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        ) : (
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        )}
        <div className="flex-1 space-y-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{copy.title}</p>
            <p className="text-muted-foreground text-xs">{copy.body}</p>
          </div>
          {copy.action === 'allow' && (
            <Button size="sm" onClick={onAllow} className="h-7 text-xs">
              <MapPin className="mr-1 h-3 w-3" />
              Allow Location Access
            </Button>
          )}
          {copy.action === 'retry' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-7 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-2.5">
      <MapPin className="h-4 w-4 shrink-0 text-green-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {formatCoord(state.location.latitude, state.location.longitude)}
        </p>
        <p className="text-muted-foreground text-xs">
          ±{Math.round(state.location.accuracy ?? 0)} m accuracy
        </p>
      </div>
      <Badge
        variant="outline"
        className="shrink-0 border-green-300 text-xs text-green-700 dark:border-green-700 dark:text-green-400"
      >
        GPS
      </Badge>
    </div>
  );
}
