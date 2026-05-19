import { useQuery } from '@tanstack/react-query';
import { subContractsService } from '@/services/sub-contracts-service';
import { subContractKeys } from './sub-contract-keys';

export const useSubContracts = () =>
  useQuery({
    queryKey: subContractKeys.lists(),
    queryFn: () => subContractsService.getAll(),
  });

export const useSubContract = (id: number) =>
  useQuery({
    queryKey: subContractKeys.detail(id),
    queryFn: () => subContractsService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
