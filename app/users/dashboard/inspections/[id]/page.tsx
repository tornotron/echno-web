'use client';

import { use } from 'react';
import { InspectionRuntime } from '@/features/inspections/components';

export default function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <InspectionRuntime inspectionId={Number(id)} />;
}
