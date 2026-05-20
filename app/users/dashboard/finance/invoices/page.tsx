'use client';

import { mockProjects } from '@/components/shared/mock-data';
import { useInvoices } from '@/hooks/invoices';
import { InvoicesFeature } from '@/features/invoices';

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, isError } = useInvoices();
  const projects = mockProjects;

  return (
    <InvoicesFeature
      invoices={invoices}
      projects={projects}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
