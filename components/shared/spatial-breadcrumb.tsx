'use client';

import { Fragment } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import type { SpatialPathSegment } from '@tornotron/echno-core/spatial/types';
import { cn } from '@/lib/utils/index';

interface SpatialBreadcrumbProps {
  path: readonly SpatialPathSegment[] | undefined;
  /** What to show when the path is empty; nothing by default. */
  fallback?: string;
  /** Use names instead of codes. */
  byName?: boolean;
  className?: string;
}

/**
 * The `Building > Floor > Zone > Element` trail an inspection, defect or
 * check item carries in `spatialPath`. Renders nothing (or the fallback)
 * when the entity only has a free-text location.
 */
export function SpatialBreadcrumb({
  path,
  fallback,
  byName = false,
  className,
}: SpatialBreadcrumbProps) {
  if (!path || path.length === 0) {
    return fallback ? (
      <span className={cn('text-muted-foreground text-sm', className)}>
        {fallback}
      </span>
    ) : null;
  }
  return (
    <span
      data-testid="spatial-breadcrumb"
      className={cn(
        'inline-flex flex-wrap items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300',
        className
      )}
      title={path.map((s) => `${s.code} ${s.name}`).join(' > ')}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      {path.map((segment, index) => (
        <Fragment key={segment.id}>
          {index > 0 && (
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
          )}
          <span>{byName ? segment.name || segment.code : segment.code}</span>
        </Fragment>
      ))}
    </span>
  );
}
