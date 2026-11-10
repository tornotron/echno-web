'use client';

import { useState } from 'react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useLlmSpend,
  usePackageLlmCalls,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type { LlmCallOutcome } from '@tornotron/echno-core/document-ingestion/types';
import { llmOutcomeLabels, pagesLabel } from '../lib/labels';

export function usd(value: number): string {
  return `$${value.toFixed(value !== 0 && Math.abs(value) < 1 ? 4 : 2)}`;
}

function ofLimit(used: string, limit: number, limitText: string): string {
  return limit > 0 ? `${used} of ${limitText}` : used;
}

/**
 * What AI reading cost for this package and for the organization this
 * month, against the limits, and the ledger of every call: which pages of
 * which file were sent, to which model, and what came back. The ledger holds
 * no document text.
 */
export function LlmSpendPanel({
  packageId,
  fileNames,
}: {
  packageId: string;
  fileNames: Record<string, string>;
}) {
  const spend = useLlmSpend(packageId);
  const [showCalls, setShowCalls] = useState(false);
  const calls = usePackageLlmCalls(showCalls ? packageId : undefined, {
    size: 50,
  });

  if (spend.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(spend.error)}
      </p>
    );
  }
  const s = spend.data;
  if (!s) return null;
  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="llm-spend">
      <p>
        This package: {s.packageCalls} AI reading calls,{' '}
        {ofLimit(
          `${s.packageTokens.toLocaleString('en-IN')} tokens`,
          s.packageTokenLimit,
          s.packageTokenLimit.toLocaleString('en-IN')
        )}
        , about{' '}
        {ofLimit(
          usd(s.packageCostUsd),
          s.packageUsdLimit,
          usd(s.packageUsdLimit)
        )}
        .
      </p>
      <p>
        Your organization this month: {s.monthCalls} calls,{' '}
        {ofLimit(
          `${s.monthTokens.toLocaleString('en-IN')} tokens`,
          s.monthTokenLimit,
          s.monthTokenLimit.toLocaleString('en-IN')
        )}
        , about{' '}
        {ofLimit(usd(s.monthCostUsd), s.monthUsdLimit, usd(s.monthUsdLimit))}.
      </p>
      {!s.pricesKnown && (
        <p className="text-muted-foreground">
          A model used here has no known price, so the dollar figures are lower
          than the real cost.
        </p>
      )}
      {s.exceeded && <p className="text-destructive">{s.exceeded}</p>}
      <button
        type="button"
        className="text-primary w-fit text-xs hover:underline"
        onClick={() => setShowCalls(!showCalls)}
      >
        {showCalls ? 'Hide what was sent' : 'Show what was sent'}
      </button>
      {showCalls && calls.isError && (
        <p role="alert" className="text-destructive">
          {getErrorMessage(calls.error)}
        </p>
      )}
      {showCalls && calls.data && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-2 py-1 font-medium">When</th>
                <th className="px-2 py-1 font-medium">File and pages</th>
                <th className="px-2 py-1 font-medium">Model</th>
                <th className="px-2 py-1 font-medium">Outcome</th>
                <th className="px-2 py-1 text-right font-medium">Tokens</th>
                <th className="px-2 py-1 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {calls.data.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-2 py-2">
                    Nothing has been sent for this package.
                  </td>
                </tr>
              )}
              {calls.data.content.map((call) => (
                <tr key={call.id} className="border-t">
                  <td className="px-2 py-1 whitespace-nowrap">
                    {call.calledAt
                      ? new Date(call.calledAt).toLocaleString('en-IN')
                      : ''}
                  </td>
                  <td className="px-2 py-1">
                    {fileNames[call.documentId] ?? 'A file'},{' '}
                    {pagesLabel(call.pages)}
                  </td>
                  <td className="px-2 py-1">{call.model ?? ''}</td>
                  <td className="px-2 py-1">
                    {llmOutcomeLabels[call.outcome as LlmCallOutcome] ??
                      call.outcome}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {(call.promptTokens ?? 0) + (call.completionTokens ?? 0)}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {call.estimatedCostUsd === undefined
                      ? ''
                      : usd(call.estimatedCostUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
