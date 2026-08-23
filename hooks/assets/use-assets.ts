import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { assetsService } from '@/services/assets-service';
import type { AssetFormData } from '@/features/assets/components/asset-form';
import { assetKeys } from './asset-keys';

/** Fetches all assets for the current organization. */
export const useAssets = () =>
  useQuery({
    queryKey: assetKeys.lists(),
    queryFn: () => assetsService.getAll(),
  });

/**
 * Fetches a single asset by id. Stays disabled until `id` is truthy, so it is
 * safe to call before the route param resolves.
 */
export const useAsset = (id: number) =>
  useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetsService.getById(id),
    enabled: !!id,
  });

/**
 * Creates an asset and invalidates the asset list on success so the new row
 * appears without a manual refetch.
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: AssetFormData) => assetsService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

/**
 * Updates an asset by id, then invalidates both the list and that asset's
 * detail cache so both views reflect the change.
 */
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: AssetFormData }) =>
      assetsService.update(id, form),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
    },
  });
};

/**
 * Deletes an asset by id and invalidates the asset list so the removed row
 * disappears without a manual refetch.
 */
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assetsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};
