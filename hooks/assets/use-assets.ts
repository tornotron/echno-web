import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { assetsService } from '@/services/assets-service';
import type { AssetFormData } from '@/features/assets/components/asset-form';
import { assetKeys } from './asset-keys';

export const useAssets = () =>
  useQuery({
    queryKey: assetKeys.lists(),
    queryFn: () => assetsService.getAll(),
  });

export const useAsset = (id: number) =>
  useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetsService.getById(id),
    enabled: !!id,
  });

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: AssetFormData) => assetsService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

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

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assetsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};
