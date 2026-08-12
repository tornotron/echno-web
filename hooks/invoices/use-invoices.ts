import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesService } from '@/services/invoices-service';
import type {
  CreateConstructionInvoiceRequest,
  UpdateConstructionInvoiceRequest,
} from '@tornotron/echno-core/finance/types';
import { invoiceKeys } from './invoice-keys';

export const useInvoices = () =>
  useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: () => invoicesService.getAll(),
  });

export const useInvoiceById = (id: string) =>
  useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesService.getById(id),
    enabled: !!id,
  });

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
