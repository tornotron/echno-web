import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subContractsService } from '@/services/sub-contracts-service';
import type { SubContractFormValues } from '@/features/sub-contracts/components/sub-contract-form';
import { subContractKeys } from './sub-contract-keys';

/** Fetches all sub-contracts for the current organization. */
export const useSubContracts = () =>
  useQuery({
    queryKey: subContractKeys.lists(),
    queryFn: () => subContractsService.getAll(),
  });

/**
 * Fetches a single sub-contract by id. Stays disabled until `id` is a finite
 * positive number, so it is safe to call before the route param resolves.
 */
export const useSubContract = (id: number) =>
  useQuery({
    queryKey: subContractKeys.detail(id),
    queryFn: () => subContractsService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });

/**
 * Creates a sub-contract and invalidates the sub-contract list on success so
 * the new row appears without a manual refetch.
 */
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

/**
 * Updates a sub-contract by id, then invalidates both the list and that
 * sub-contract's detail cache so both views reflect the change.
 */
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

/**
 * Deletes a sub-contract by id and invalidates the sub-contract list so the
 * removed row disappears without a manual refetch.
 */
export const useDeleteSubContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subContractsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subContractKeys.lists() });
    },
  });
};
