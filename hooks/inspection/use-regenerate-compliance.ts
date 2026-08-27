import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { inspectionService } from '@/services/inspection-service';
import { toast } from '@/lib/styles/toast-styles';
import { inspectionKeys } from './inspection-keys';

// How long to wait before looking for the results a second time after the
// browser has given up waiting. See the timeout branch of onError below.
const POST_TIMEOUT_REFETCH_MS = 20_000;

const TIMEOUT_TOAST_DURATION_MS = 12_000;

/** True for the two ways this call reports "nobody waited long enough". */
function isTimeout(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.isTimeout || error.status === 504)
  );
}

// Runs (or re-runs) AI compliance generation for a project. On success the
// inspection list queries are invalidated so the new compliance inspections
// show up in the list, detail, and project compliance tab.
export const useRegenerateCompliance = () => {
  const queryClient = useQueryClient();
  return useMutation({
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
    onError: (error) => {
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
      toast.error(getErrorTitle(error, 'Failed to generate compliances'), {
        description: getErrorMessage(error),
      });
    },
  });
};
