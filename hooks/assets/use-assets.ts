import { useQuery } from '@tanstack/react-query';
import { assetsService } from '@/services/assets-service';
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
