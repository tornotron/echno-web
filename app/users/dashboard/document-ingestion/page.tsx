'use client';

import { PageHeader } from '@/components/common/page-header';
import {
  IngestionGate,
  IngestPackagesList,
} from '@/features/document-ingestion';

export default function DocumentIngestionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Import from documents"
        description="Upload a tender BOQ workbook, check each row against its source cell, and write the rows you accept to a contract."
      />
      <IngestionGate>
        <IngestPackagesList />
      </IngestionGate>
    </div>
  );
}
