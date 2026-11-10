'use client';

import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useTenderProfile } from '@tornotron/echno-core/document-ingestion/hooks';
import type { TenderProfile } from '@tornotron/echno-core/document-ingestion/types';
import { INGEST_TARGET } from '@tornotron/echno-core/document-ingestion/types';
import { projectTargetFieldLabel } from '../lib/labels';
import { ProvenanceList } from './ProvenanceList';

const ROWS: {
  label: string;
  text: (p: TenderProfile) => string | undefined;
}[] = [
  { label: 'Client', text: (p) => p.client },
  { label: 'Estimated value', text: (p) => p.estimatedValueText },
  { label: 'EMD', text: (p) => p.emdText },
  { label: 'Tender fee', text: (p) => p.tenderFeeText },
  { label: 'Bid due', text: (p) => p.bidDueText },
  { label: 'Bid validity', text: (p) => p.bidValidityText },
  { label: 'Duration', text: (p) => p.durationText },
  { label: 'Consultant', text: (p) => p.consultant },
  { label: 'Engineer', text: (p) => p.engineer },
  { label: 'Scope', text: (p) => p.scope },
];

/**
 * The accepted tender facts a project has no field for, each as printed, and
 * where each one was read.
 */
export function TenderProfileView({
  packageId,
  fileNames,
}: {
  packageId: string;
  fileNames: Record<string, string>;
}) {
  const { data, isLoading, isError, error } = useTenderProfile(packageId);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading the tender profile
      </div>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(error)}
      </p>
    );
  }
  if (!data) {
    return (
      <p className="text-muted-foreground text-sm">
        No tender facts are applied yet. They appear here once you apply the
        accepted fields.
      </p>
    );
  }
  const filled = ROWS.filter((row) => row.text(data));
  return (
    <div className="flex flex-col gap-4" data-testid="tender-profile">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
        {filled.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="whitespace-pre-wrap">{row.text(data)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Where each fact came from</p>
        <ProvenanceList
          targetType={INGEST_TARGET.TENDER_PROFILE}
          targetId={data.id}
          fileNames={fileNames}
          fieldLabel={projectTargetFieldLabel}
        />
      </div>
    </div>
  );
}
