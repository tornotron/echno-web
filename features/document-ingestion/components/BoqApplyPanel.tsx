'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useBillingContracts } from '@tornotron/echno-core/contract-billing/hooks';
import {
  useApplyCandidates,
  useIngestCandidates,
  useSetBoqTarget,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  ApplyResult,
  IngestPackage,
} from '@tornotron/echno-core/document-ingestion/types';
import { boqItemOf } from '@tornotron/echno-core/document-ingestion/types';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import { sourceLabel } from '../lib/cells';
import { SELECT_CLASS } from '../lib/styles';

interface BoqApplyPanelProps {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}

/**
 * Picks the sub-contract the package's BOQ goes to and writes the accepted
 * rows to it. With no contract picked, the accepted rows stay on the package
 * as its tender BOQ, and the backend says so when apply is pressed. A row the
 * contract refuses turns "Not applied" with the reason, listed here, and the
 * person corrects and accepts it again in the review table.
 */
export function BoqApplyPanel({ pkg, fileNames }: BoqApplyPanelProps) {
  const contracts = useBillingContracts({
    projectId: pkg.projectId,
    pageSize: 200,
  });
  const setTarget = useSetBoqTarget();
  const apply = useApplyCandidates();
  const failed = useIngestCandidates(pkg.id, {
    kind: 'BOQ_ITEM',
    status: 'APPLY_FAILED',
    size: 200,
  });
  const [result, setResult] = useState<ApplyResult | null>(null);

  const options = contracts.data?.content ?? [];
  const target = pkg.subContractId;
  const targetListed =
    target === undefined || options.some((c) => c.subContractId === target);

  const runApply = async () => {
    setResult(null);
    const outcome = await apply.mutateAsync({
      packageId: pkg.id,
      kind: 'BOQ_ITEM',
    });
    if (outcome) setResult(outcome);
  };

  const failedRows = failed.data?.content ?? [];

  return (
    <div className="flex flex-col gap-4" data-testid="boq-apply">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="boq-target">Contract</Label>
          <select
            id="boq-target"
            className={`${SELECT_CLASS} min-w-72`}
            value={target ?? ''}
            disabled={setTarget.isPending}
            onChange={(event) => {
              const value = event.target.value;
              setResult(null);
              setTarget.mutate({
                packageId: pkg.id,
                subContractId: value ? Number(value) : null,
              });
            }}
          >
            <option value="">No contract, keep as the tender BOQ</option>
            {!targetListed && (
              <option value={target}>Contract #{target}</option>
            )}
            {options.map((contract) => (
              <option
                key={contract.subContractId}
                value={contract.subContractId}
              >
                {[contract.contractRef, contract.contractName]
                  .filter(Boolean)
                  .join(' ')}
                {contract.contractorName ? `, ${contract.contractorName}` : ''}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          disabled={apply.isPending}
          onClick={() => {
            runApply().catch(() => {});
          }}
        >
          {apply.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Apply to contract
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        {target === undefined
          ? 'No contract is picked. Accepted rows stay on this package as its tender BOQ until you pick one.'
          : 'Accepted rows are written to this contract as its BOQ lines. You cannot change the contract once a row is applied.'}
        {pkg.projectId === undefined &&
          ' The package has no project, so every contract is listed.'}
      </p>
      {contracts.isError && (
        <p role="alert" className="text-destructive text-sm">
          The contract list did not load: {getErrorMessage(contracts.error)}
        </p>
      )}
      {setTarget.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(setTarget.error)}
        </p>
      )}
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
      {failedRows.length > 0 && (
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">
            Rows the contract refused ({failedRows.length})
          </p>
          <p className="text-muted-foreground">
            Correct each row in the review table, accept it again, then apply.
          </p>
          <ul className="list-disc pl-5">
            {failedRows.map((c) => {
              const docName = c.documentId
                ? fileNames[c.documentId]
                : undefined;
              return (
                <li key={c.id}>
                  {sourceLabel(c, docName)}: {boqItemOf(c).description ?? ''}.{' '}
                  <span className="text-destructive">
                    {c.applyError ?? 'No reason was given.'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
