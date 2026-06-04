/**
 * hooks/material-consumptions/use-material-consumption-mutations.ts
 *
 * React Query mutation hooks for material-consumption writes. Single-mutation
 * module — the backend exposes no update or delete endpoint, only POST create.
 *
 * Cache discipline (Milestone 9 — material-consumption):
 *   - Rule A: POST returns the full `MaterialConsumptionDto`. Seed the detail
 *     cache so a navigation to `/resources/material-consumptions/[id]` after
 *     create renders without a refetch.
 *   - Own-namespace invalidation is intentionally broad (`materialConsumptionsKeys.all`)
 *     because the create response is a single consumption — the
 *     list / paginated / byMaterial / byType / byTask / byDateRange caches
 *     each apply a different filter we can't replay deterministically against
 *     a single new entry. One namespace-prefix invalidate is the right shape.
 *   - Cross-namespace edge: material stock decreases server-side. Following
 *     the site-transfer convention (Milestone 6), invalidate
 *     `materialsKeys.stock(materialId)` only — material list / detail caches
 *     embed `currentStock` but ride out the drift via `staleTime`, matching
 *     the established pattern. No task cache touch because `Task` does NOT
 *     embed consumption-derived state; the task-scoped derived view
 *     (`useConsumptionsByTask`) is inside the consumption namespace and
 *     covered by the prefix invalidate above.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialConsumptionsService } from '@/services/material-consumptions-service';
import { materialsKeys } from '@/hooks/materials/material-keys';
import { materialConsumptionsKeys } from './material-consumption-keys';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import type {
  CreateMaterialConsumptionRequest,
  MaterialConsumption,
} from '@/types/materials';

export const useCreateConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMaterialConsumptionRequest) =>
      materialConsumptionsService.create(dto),
    onSuccess: (consumption) => {
      // POST /material-consumptions/web → MaterialConsumptionDto (Rule A, full).
      queryClient.setQueryData<MaterialConsumption>(
        materialConsumptionsKeys.detail(consumption.id),
        consumption
      );
      // Own-namespace prefix invalidate: list, paginated, byMaterial, byType,
      // byTask, byDateRange. Each applies a server-side filter we can't
      // replay against a single response, so a broad invalidate is the
      // correct shape for a single-create endpoint.
      queryClient.invalidateQueries({
        queryKey: materialConsumptionsKeys.all,
      });
      // Cross-namespace (consumption → material): recording a consumption
      // decreases `Material.currentStock` server-side. Invalidate the
      // canonical stock query so any stock display refetches. Following the
      // site-transfer convention — material list/detail also embed
      // currentStock but ride out the drift via staleTime.
      queryClient.invalidateQueries({
        queryKey: materialsKeys.stock(consumption.materialId),
      });
      toast.success('Consumption Recorded', {
        description: 'Material consumption has been recorded successfully.',
      });
    },
    onError: (error) =>
      toast.error(getErrorTitle(error, 'Failed to Record Consumption'), {
        description: getErrorMessage(error),
      }),
  });
};
