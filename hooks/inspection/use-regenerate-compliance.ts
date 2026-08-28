import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { inspectionService } from '@/services/inspection-service';
import { toast } from '@/lib/styles/toast-styles';
import { inspectionKeys } from './inspection-keys';

// How long to wait before looking for the results a second time after the
// browser has given up waiting. See the timeout branch of onError below.
const POST_TIMEOUT_REFETCH_MS = 20_000;

const TIMEOUT_TOAST_DURATION_MS = 12_000;

// The two outcomes below have to be read before they disappear, and the one
// that saved nothing has to stay up longest, because it is the one a user is
// most likely to mistake for a clean run.
const CONFLICT_TOAST_DURATION_MS = 12_000;

const INCOMPLETE_TOAST_DURATION_MS = 20_000;

/** True for the two ways this call reports "nobody waited long enough". */
function isTimeout(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.isTimeout || error.status === 504)
  );
}

/**
 * True when two generations for this project collided and the backend's write
 * retries ran out. Transient: the next attempt normally wins the race or finds
 * the other run's rows already there.
 */
function isConcurrentGeneration(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

/**
 * True when the model's answer came back truncated, unparsable, or missing a
 * rule that was sent to it. The backend refuses the whole run in that case
 * rather than saving the part it did assess, so nothing was written. Not worth
 * retrying: the same over-long catalogue truncates the same way.
 */
function isIncompleteAnalysis(error: unknown): boolean {
  return error instanceof ApiError && error.status === 502;
}

// Runs (or re-runs) AI compliance generation for a project. On success the
// inspection list queries are invalidated so the new compliance inspections
// show up in the list, detail, and project compliance tab.
export const useRegenerateCompliance = () => {
  const queryClient = useQueryClient();
  // The conflict toast offers to run the analysis again, so it needs the very
  // mutation being built here. The ref breaks that circle; it is filled in by
  // the effect below and read only from a click on that toast.
  const runAgain = useRef<((projectId: number) => void) | null>(null);

  const mutation = useMutation({
    mutationFn: (projectId: number) =>
      inspectionService.regenerateCompliance(projectId),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      toast.success('Compliance analysis complete', {
        description:
          created.length > 0
            ? `${created.length} compliance ${
                created.length === 1 ? 'item' : 'items'
              } generated.`
            : 'No new compliances were required.',
      });
    },
    onError: (error, projectId) => {
      // A timeout here does not mean the analysis failed. The browser stops
      // waiting, but the request already reached the backend, which runs the
      // analysis to the end and saves what it produced. Reporting this as a
      // failure is what made the module look broken: the compliances were
      // there all along, one page reload away. So look for them now, and once
      // more shortly afterwards to catch an analysis that was still finishing.
      if (isTimeout(error)) {
        queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
        }, POST_TIMEOUT_REFETCH_MS);
        toast.info('Compliance analysis is still running', {
          description:
            'It is taking longer than usual. The results will appear here on their own once it finishes; reload the page if nothing shows up in a minute.',
          duration: TIMEOUT_TOAST_DURATION_MS,
        });
        return;
      }

      // Two generations for this project overlapped and the backend gave up
      // retrying the write, so this one stopped without saving anything. The
      // project is fine and the run is worth repeating, which is why this is a
      // warning with a retry rather than an error. The lists are refreshed all
      // the same, because the run that won the race did commit its rows.
      if (isConcurrentGeneration(error)) {
        queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
        toast.warning('Compliance analysis did not run', {
          description:
            'Another analysis for this project was running at the same time, so this one stopped and nothing was saved for it. Try again in a moment.',
          duration: CONFLICT_TOAST_DURATION_MS,
          action: {
            label: 'Try again',
            onClick: () => runAgain.current?.(projectId),
          },
        });
        return;
      }

      // The model's answer was cut short or left a rule unassessed, so the
      // backend threw the whole run away instead of saving the part it did
      // assess. This used to arrive as a success with an empty list, which
      // reads exactly like a clean run, and that is the misreading this branch
      // exists to prevent: say plainly that nothing was saved, and offer no
      // retry, because the same catalogue truncates the same way. The backend's
      // own wording is dropped, since "Bad gateway" invites a pointless retry.
      if (isIncompleteAnalysis(error)) {
        toast.error('Compliance analysis could not be completed', {
          description:
            'The analysis stopped before it covered every rule, so nothing was saved. This is not the same as finding no compliances: none were recorded. Running it again usually ends the same way, so report it if it keeps happening.',
          duration: INCOMPLETE_TOAST_DURATION_MS,
        });
        return;
      }

      toast.error(getErrorTitle(error, 'Failed to generate compliances'), {
        description: getErrorMessage(error),
      });
    },
  });

  // Written after the render rather than during it: the click that reads it
  // cannot happen before the toast exists, and the toast cannot exist before
  // the first request has failed.
  useEffect(() => {
    runAgain.current = mutation.mutate;
  }, [mutation.mutate]);

  return mutation;
};
