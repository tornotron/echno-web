import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { inspectionService } from '@/services/inspection-service';
import { toast } from '@/lib/styles/toast-styles';
import { inspectionKeys } from './inspection-keys';

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
      toast.error(getErrorTitle(error, 'Failed to generate compliances'), {
        description: getErrorMessage(error),
      });
    },
  });
};
