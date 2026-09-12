'use client';

import { useMemo } from 'react';
import {
  ObservationOutcomeKind,
  ObservationSource,
} from '@tornotron/echno-core/inspection/types';
import type { Observation } from '@tornotron/echno-core/inspection/types';
import { useObservations } from '@/hooks/inspection';
import {
  ObservationConfidence,
  ObservationSourceBadge,
  ObservationStatusBadge,
} from './observation-badges';

/**
 * Finds the AI observation the compliance generator wrote for a suggested
 * inspection. The list endpoint filters on `inspectionId`, which is null on
 * those rows (the inspection is their outcome, not their parent), so the
 * project's AI observations are fetched and matched on `outcomeRef`.
 */
export function useComplianceObservation(
  projectId: number | undefined,
  inspectionId: string
): { observation: Observation | undefined; isLoading: boolean } {
  const { data, isLoading } = useObservations({
    projectId,
    source: ObservationSource.AI,
    size: 100,
  });
  const observation = useMemo(
    () =>
      data?.content.find(
        (row) =>
          row.outcomeKind === ObservationOutcomeKind.INSPECTION &&
          row.outcomeRef === inspectionId
      ),
    [data, inspectionId]
  );
  return { observation, isLoading };
}

/**
 * The durable record behind an AI compliance suggestion: which model
 * proposed it, how sure it was, and where the human decision stands.
 * Approving the suggested inspection accepts it; dismissing rejects it.
 */
export function ComplianceObservationStatus({
  projectId,
  inspectionId,
}: {
  projectId: number | undefined;
  inspectionId: string;
}) {
  const { observation, isLoading } = useComplianceObservation(
    projectId,
    inspectionId
  );
  if (isLoading) return null;
  if (!observation) {
    return (
      <p className="text-muted-foreground text-xs">
        No observation is on record for this suggestion (it predates
        observations).
      </p>
    );
  }
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="compliance-observation"
    >
      <ObservationSourceBadge observation={observation} />
      <ObservationConfidence confidence={observation.confidence} />
      <ObservationStatusBadge status={observation.reviewStatus} />
      {observation.reviewNote && (
        <span className="text-muted-foreground text-xs">
          {observation.reviewNote}
        </span>
      )}
    </div>
  );
}
