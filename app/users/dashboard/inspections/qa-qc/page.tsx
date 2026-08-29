'use client';

import { TypedInspectionView } from '@/features/inspections/components';
import { InspectionCategory, InspectionType } from '@/types/inspection';

export default function QaQcInspectionsPage() {
  return (
    <TypedInspectionView
      category={InspectionCategory.QA_QC}
      createType={InspectionType.QUALITY}
      showTradeFilter
      title="QA/QC"
      description="Quality assurance and control inspections across your projects"
    />
  );
}
