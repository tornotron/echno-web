'use client';

import { TypedInspectionView } from '@/features/inspections/components';
import { InspectionType } from '@/types/inspection';

export default function SafetyInspectionsPage() {
  return (
    <TypedInspectionView
      type={InspectionType.SAFETY}
      title="Safety"
      description="Site safety inspections: PPE, access, plant and housekeeping"
    />
  );
}
