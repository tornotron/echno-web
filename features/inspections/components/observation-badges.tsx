'use client';

import { Bot, Camera, Plane, User, Cpu } from 'lucide-react';
import {
  ObservationOutcomeKind,
  ObservationReviewStatus,
  ObservationSource,
  observationOutcomeKindLabels,
  observationReviewStatusLabels,
  observationSourceLabels,
} from '@tornotron/echno-core/inspection/types';
import type { Observation } from '@tornotron/echno-core/inspection/types';
import { Badge } from '@/components/shadcn/badge';
import { cn } from '@/lib/utils/index';

const sourceIcons: Record<ObservationSource, typeof User> = {
  [ObservationSource.HUMAN]: User,
  [ObservationSource.AI]: Bot,
  [ObservationSource.DRONE]: Plane,
  [ObservationSource.ROBOT]: Cpu,
  [ObservationSource.FIXED_CAMERA]: Camera,
};

const statusColors: Record<ObservationReviewStatus, string> = {
  [ObservationReviewStatus.PENDING]:
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  [ObservationReviewStatus.ACCEPTED]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ObservationReviewStatus.MODIFIED]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [ObservationReviewStatus.REJECTED]:
    'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

/** Who or what saw it, with the model or device named when there is one. */
export function ObservationSourceBadge({
  observation,
  className,
}: {
  observation: Pick<
    Observation,
    'source' | 'modelName' | 'modelVersion' | 'sourceDeviceId'
  >;
  className?: string;
}) {
  const Icon = sourceIcons[observation.source];
  const detail =
    observation.source === ObservationSource.AI
      ? [observation.modelName, observation.modelVersion]
          .filter(Boolean)
          .join(' ')
      : observation.sourceDeviceId;
  return (
    <Badge variant="outline" className={cn('gap-1 font-normal', className)}>
      <Icon className="h-3 w-3" />
      {observationSourceLabels[observation.source]}
      {detail && <span className="text-muted-foreground">· {detail}</span>}
    </Badge>
  );
}

/** Where the human decision stands. */
export function ObservationStatusBadge({
  status,
  className,
}: {
  status: ObservationReviewStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(statusColors[status], className)}>
      {observationReviewStatusLabels[status]}
    </Badge>
  );
}

/** What the observation became; nothing for `NONE`. */
export function ObservationOutcomeBadge({
  kind,
  className,
}: {
  kind: ObservationOutcomeKind;
  className?: string;
}) {
  if (kind === ObservationOutcomeKind.NONE) return null;
  return (
    <Badge variant="secondary" className={className}>
      {observationOutcomeKindLabels[kind]}
    </Badge>
  );
}

/** Model confidence as a percentage; nothing when the producer gave none. */
export function ObservationConfidence({
  confidence,
  className,
}: {
  confidence: number | undefined;
  className?: string;
}) {
  if (confidence === undefined) return null;
  const percent = Math.round(confidence * 100);
  return (
    <span
      className={cn('text-muted-foreground text-xs tabular-nums', className)}
      title="Model confidence"
    >
      {percent}%
    </span>
  );
}
