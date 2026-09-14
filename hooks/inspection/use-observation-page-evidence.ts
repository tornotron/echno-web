'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import type { Observation } from '@tornotron/echno-core/inspection/types';
import { observationKeys } from '@tornotron/echno-core/inspection/hooks';
import { observationService } from '@tornotron/echno-core/observation/services';
import { shouldRetry } from '@/lib/query/retry';

export interface ObservationEvidenceState {
  attachments: Attachment[] | undefined;
  isLoading: boolean;
}

/**
 * Evidence for every observation on a queue page, fetched from one place.
 *
 * The backend has no "evidence for these observations" endpoint, so one
 * request per observation is still the unit; what changes is that a row
 * whose refs point at nothing in the attachment store (only capture refs,
 * or no refs at all) makes no request, and the requests that remain are
 * issued by the page rather than by each row as it mounts. The query keys
 * are the per-observation ones, so the review sheet reads the same cache.
 */
export function useObservationPageEvidence(
  observations: readonly Pick<Observation, 'id' | 'evidenceRefs'>[]
): Map<string, ObservationEvidenceState> {
  const withStoreRefs = useMemo(
    () =>
      observations
        .filter((o) =>
          o.evidenceRefs.some((ref) => typeof ref.attachmentId === 'number')
        )
        .map((o) => o.id),
    [observations]
  );
  const results = useQueries({
    queries: withStoreRefs.map((id) => ({
      queryKey: observationKeys.evidence(id),
      queryFn: () => observationService.getEvidence(id),
      staleTime: 60_000,
      retry: shouldRetry,
    })),
  });
  return useMemo(() => {
    const map = new Map<string, ObservationEvidenceState>();
    for (const o of observations) {
      map.set(o.id, { attachments: [], isLoading: false });
    }
    for (const [index, id] of withStoreRefs.entries()) {
      const result = results[index];
      map.set(id, {
        attachments: result?.data,
        isLoading: result?.isLoading ?? false,
      });
    }
    return map;
  }, [observations, withStoreRefs, results]);
}
