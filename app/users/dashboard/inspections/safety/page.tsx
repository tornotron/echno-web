'use client';

import { TypedInspectionView } from '@/features/inspections/components';
import { InspectionCategory, InspectionType } from '@/types/inspection';

export default function SafetyInspectionsPage() {
  return (
    <TypedInspectionView
      category={InspectionCategory.SAFETY}
      createType={InspectionType.SAFETY}
      title="Safety"
      description="Site safety inspections: PPE, access, plant and housekeeping"
    />
  );
}
