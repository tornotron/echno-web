'use client';

import { PageHeader } from '@/components/common/page-header';
import {
  IngestionGate,
  IngestPackagesList,
  IngestSettingsPanel,
} from '@/features/document-ingestion';

export default function DocumentIngestionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Import from documents"
        description="Upload tender files, confirm what each one is, check each value read from them against its page or cell, and apply the values you accept."
      />
      <IngestionGate>
        <div className="flex flex-col gap-6">
          <IngestPackagesList />
          <IngestSettingsPanel />
        </div>
      </IngestionGate>
    </div>
  );
}
