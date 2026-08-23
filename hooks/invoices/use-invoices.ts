import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesService } from '@/services/invoices-service';
import type {
  CreateConstructionInvoiceRequest,
  UpdateConstructionInvoiceRequest,
} from '@tornotron/echno-core/finance/types';
import { invoiceKeys } from './invoice-keys';

/** Fetches all construction invoices for the current organization. */
export const useInvoices = () =>
  useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: () => invoicesService.getAll(),
  });

/**
 * Fetches a single construction invoice by id. Stays disabled until `id` is a
 * non-empty string, so it is safe to call before the route param resolves.
 */
export const useInvoiceById = (id: string) =>
  useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesService.getById(id),
    enabled: !!id,
  });

/**
 * Creates a construction invoice and invalidates the invoice list on success
 * so the new row appears without a manual refetch.
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateConstructionInvoiceRequest) =>
      invoicesService.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
};

/**
 * Updates a construction invoice by id, then invalidates both the list and
 * that invoice's detail cache so both views reflect the change.
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      req,
    }: {
      id: string;
      req: UpdateConstructionInvoiceRequest;
    }) => invoicesService.update(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(data.id),
      });
    },
  });
};
