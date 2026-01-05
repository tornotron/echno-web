'use client';

import { mockInvoices, mockProjects } from '@/components/shared/mock-data';
import { InvoicesFeature } from '@/features/invoices';

/**
 * Invoices page - thin routing layer
 * Fetches/provides data and renders the feature component
 */
export default function InvoicesPage() {
  // In a real application, this would fetch data from an API
  // For now, we're using mock data
  const invoices = mockInvoices;
  const projects = mockProjects;

  return <InvoicesFeature invoices={invoices} projects={projects} />;
}
