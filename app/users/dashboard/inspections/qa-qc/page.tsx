'use client';

import { TypedInspectionView } from '@/features/inspections/components';
import { InspectionType } from '@/types/inspection';

export default function QaQcInspectionsPage() {
  return (
    <TypedInspectionView
      type={InspectionType.QUALITY}
      title="QA/QC"
      description="Quality assurance and control inspections across your projects"
    />
  );
}
