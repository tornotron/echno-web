'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { ProjectBillingView } from '@/features/contract-billing';

export default function ProjectBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = /^\d+$/.test(id) ? Number(id) : Number.NaN;
  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    notFound();
  }
  return <ProjectBillingView projectId={projectId} />;
}
