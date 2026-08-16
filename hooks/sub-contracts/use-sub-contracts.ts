import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subContractsService } from '@/services/sub-contracts-service';
import type { SubContractFormValues } from '@/features/sub-contracts/components/sub-contract-form';
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

export const useCreateSubContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SubContractFormValues) =>
      subContractsService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subContractKeys.lists() });
    },
  });
};

export const useUpdateSubContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: SubContractFormValues }) =>
      subContractsService.update(id, values),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: subContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subContractKeys.detail(id) });
    },
  });
};

export const useDeleteSubContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subContractsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subContractKeys.lists() });
    },
  });
};
