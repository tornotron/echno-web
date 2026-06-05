/**
 * hooks/wbs-element/use-wbs-element-mutations.ts
 *
 * React Query mutation hooks for WBS-element writes.
 *
 * Cache discipline (Milestone 9 — wbs-element, project-scoped):
 *   - Backend returns the full `WbsElementDto` on create/update/move/recalculate
 *     and a `WbsElementDto[]` on bulk create — both are Rule A. The previous
 *     implementation invalidated `wbsElementKeys.byProject(projectId)` which
 *     prefix-matches `tree`, `leaves`, AND every per-element detail cache,
 *     blowing away the entire project's WBS namespace on every mutation while
 *     also discarding the typed payload that was right there in the response.
 *   - This file uses Rule A patching against the flat-list and detail caches
 *     where the response is sufficient to derive the new state, plus targeted
 *     exact-key invalidations for `tree(pid)` and `leaves(pid)` (derived
 *     views with embedded copies / hierarchy invariants that aren't safe to
 *     patch in place).
 *
 * Key-shape note: `byProject(pid)` = `['wbs-elements', 'project', pid]` is a
 * prefix of `tree`, `leaves`, and `detail(pid, eid)`. We rely on `setQueryData`
 * being exact-match (writes only to the precise key) and avoid
 * `invalidateQueries({ queryKey: byProject(pid) })` so we don't trigger the
 * prefix blast. Tree and leaves get explicit `invalidateQueries` calls with
 * their own exact-match keys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wbsElementService } from '@/services/wbs-element-service';
import { wbsElementKeys } from './wbs-element-keys';
import { toast } from '@/lib/styles/toast-styles';
import type {
  WbsElement,
  CreateWbsElementRequest,
  BulkCreateWbsElementsRequest,
  UpdateWbsElementRequest,
  MoveWbsElementRequest,
} from '@/types/wbs-element';

/**
 * Invalidate the two project-scoped derived views (tree + leaves) without
 * touching the flat list or detail caches. Used by every structural mutation
 * (create, bulk-create, move, delete) and by update (because tree/leaves
 * cache entries embed copies of the element's fields). Both invalidations
 * are exact-match against their own dedicated keys.
 */
function invalidateDerivedViews(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number
) {
  queryClient.invalidateQueries({
    queryKey: wbsElementKeys.tree(projectId),
    exact: true,
  });
  queryClient.invalidateQueries({
    queryKey: wbsElementKeys.leaves(projectId),
    exact: true,
  });
}

export const useCreateWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWbsElementRequest) =>
      wbsElementService.create(projectId, dto),
    onSuccess: (created) => {
      // POST /project/{projectId}/wbs/web → WbsElementDto (Rule A, full).
      queryClient.setQueryData<WbsElement>(
        wbsElementKeys.detail(projectId, created.id),
        created
      );
      queryClient.setQueryData<WbsElement[]>(
        wbsElementKeys.byProject(projectId),
        (old) => (old ? [...old, created] : undefined)
      );
      invalidateDerivedViews(queryClient, projectId);
      toast.success('WBS element created.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to create WBS element.'
      ),
  });
};

export const useBulkCreateWbsElements = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkCreateWbsElementsRequest) =>
      wbsElementService.bulkCreate(projectId, dto),
    onSuccess: (createdList) => {
      // POST /project/{projectId}/wbs/web/bulk → WbsElementDto[] (Rule A, full).
      // Backend doc labelled this `ResponseDto`; the actual response is an
      // array of full DTOs — verified via the service's safeParseWbsElements
      // path. Drift fixed in this milestone's backend-api-docs.md update.
      for (const created of createdList) {
        queryClient.setQueryData<WbsElement>(
          wbsElementKeys.detail(projectId, created.id),
          created
        );
      }
      queryClient.setQueryData<WbsElement[]>(
        wbsElementKeys.byProject(projectId),
        (old) => (old ? [...old, ...createdList] : undefined)
      );
      invalidateDerivedViews(queryClient, projectId);
      toast.success('WBS elements created.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to create WBS elements.'
      ),
  });
};

export const useUpdateWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWbsElementRequest }) =>
      wbsElementService.update(projectId, id, data),
    onSuccess: (updated) => {
      // PUT /project/{projectId}/wbs/web/{elementId} → WbsElementDto
      // (Rule A, full). UpdateWbsElementRequest cannot reparent (no
      // parentElementId field) — reparenting goes through useMoveWbsElement —
      // so this is a non-structural mutation. Patch detail + flat list in
      // place; tree and leaves caches embed copies of the changed fields, so
      // they get invalidated to refresh derived views.
      queryClient.setQueryData<WbsElement>(
        wbsElementKeys.detail(projectId, updated.id),
        updated
      );
      queryClient.setQueryData<WbsElement[]>(
        wbsElementKeys.byProject(projectId),
        (old) => old?.map((el) => (el.id === updated.id ? updated : el))
      );
      invalidateDerivedViews(queryClient, projectId);
      toast.success('WBS element updated.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to update WBS element.'
      ),
  });
};

export const useMoveWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MoveWbsElementRequest }) =>
      wbsElementService.move(projectId, id, data),
    onSuccess: (moved) => {
      // POST /project/{projectId}/wbs/web/{elementId}/move → WbsElementDto
      // (Rule A, full). Structural mutation — only the moved node's
      // parentElementId / position fields change; the flat list still
      // contains the same set of elements, so map-replace the moved element
      // in place. Tree + leaves are hierarchical/filtered views that need a
      // refetch to reflect the new parent-child relationship.
      queryClient.setQueryData<WbsElement>(
        wbsElementKeys.detail(projectId, moved.id),
        moved
      );
      queryClient.setQueryData<WbsElement[]>(
        wbsElementKeys.byProject(projectId),
        (old) => old?.map((el) => (el.id === moved.id ? moved : el))
      );
      invalidateDerivedViews(queryClient, projectId);
      toast.success('WBS element moved.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to move WBS element.'
      ),
  });
};

export const useDeleteWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (elementId: number) =>
      wbsElementService.delete(projectId, elementId),
    onSuccess: (_void, elementId) => {
      // DELETE /project/{projectId}/wbs/web/{elementId} → ApiResponse
      // (Rule C, void). Cascade behaviour (whether deleting an internal node
      // also removes its descendants server-side) is not documented in the
      // service or backend docs, so we conservatively invalidate the flat
      // list rather than filtering by ID alone — a single-ID filter would
      // leave orphaned descendants pointing to a deleted parent in the cache.
      queryClient.removeQueries({
        queryKey: wbsElementKeys.detail(projectId, elementId),
      });
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.byProject(projectId),
        // exact=true so this doesn't prefix-blast tree/leaves/detail caches;
        // we invalidate tree/leaves separately just below.
        exact: true,
      });
      invalidateDerivedViews(queryClient, projectId);
      toast.success('WBS element deleted.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete WBS element.'
      ),
  });
};
