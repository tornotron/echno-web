'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useApplyCandidates } from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  ApplyResult,
  CandidateKind,
} from '@tornotron/echno-core/document-ingestion/types';
import { Button } from '@/components/shadcn/button';
import { useCan } from '@/hooks/use-can';
import { INGEST_APPLY_ACCESS } from '../lib/access';

/**
 * Writes the accepted values of one kind to live records, and says how many
 * landed, failed and remain. A refusal from the backend is shown as it was
 * sent. Hidden from a role that may not apply.
 */
export function ApplyButton({
  packageId,
  kind,
  label,
}: {
  packageId: string;
  kind: CandidateKind;
  label: string;
}) {
  const apply = useApplyCandidates();
  const { allowed } = useCan(INGEST_APPLY_ACCESS);
  const [result, setResult] = useState<ApplyResult | null>(null);

  if (!allowed) {
    return (
      <p className="text-muted-foreground text-sm">
        A project manager or a system admin writes accepted values to the
        project.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        className="w-fit"
        disabled={apply.isPending}
        onClick={() => {
          setResult(null);
          apply
            .mutateAsync({ packageId, kind })
            .then((outcome) => outcome && setResult(outcome))
            .catch(() => {});
        }}
      >
        {apply.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {label}
      </Button>
      {apply.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(apply.error)}
        </p>
      )}
      {result && (
        <p role="status" className="text-sm">
          Applied {result.applied}, failed {result.failed}, still to apply{' '}
          {result.remaining}.
          {result.remaining > 0 && ' Press apply again to carry on.'}
        </p>
      )}
    </div>
  );
}
