import { useQuery } from '@tanstack/react-query';
import { invoicesService } from '@/services/invoices-service';
import { invoiceKeys } from './invoice-keys';

export const useInvoices = () =>
  useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: () => invoicesService.getAll(),
  });

export const useInvoiceById = (id: number) =>
  useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesService.getById(id),
    enabled: !!id,
  });
