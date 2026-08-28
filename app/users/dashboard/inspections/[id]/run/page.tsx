'use client';

import { useParams } from 'next/navigation';
import { InspectionRuntime } from '@/features/inspections/components';

export default function RunInspectionPage() {
  const params = useParams();
  const inspectionId = params.id as string;

  return <InspectionRuntime inspectionId={inspectionId} />;
}
