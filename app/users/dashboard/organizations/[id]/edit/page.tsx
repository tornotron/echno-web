'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { EditOrganizationFeature } from '@/features/organization';

interface EditOrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditOrganizationPage({
  params,
}: EditOrganizationPageProps) {
  const resolvedParams = use(params);
  const id = Number.parseInt(resolvedParams.id);

  if (Number.isNaN(id)) {
    notFound();
  }

  return <EditOrganizationFeature id={id} />;
}
