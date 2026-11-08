'use client';

import { useState } from 'react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useIngestSettings,
  useSetLlmReading,
  useSetMonthlyLlmBudget,
} from '@tornotron/echno-core/document-ingestion/hooks';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Switch } from '@/components/shadcn/switch';
import { useCan } from '@/hooks/use-can';
import { INGEST_ADMIN_ACCESS } from '../lib/access';
import { AiReadingNotice } from './AiReadingNotice';

/** A limit field as text: empty means the configured default. */
function limitText(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function limitValue(text: string): number | null | 'bad' {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : 'bad';
}

/**
 * The organization's AI reading switch and monthly limit, for a system
 * admin. The switch sits beside the plain statement of what turning it on
 * sends and to whom. Each change is recorded with who made it and when.
 */
export function IngestSettingsPanel() {
  const { allowed } = useCan(INGEST_ADMIN_ACCESS);
  const settings = useIngestSettings(allowed);
  const setReading = useSetLlmReading();
  const setBudget = useSetMonthlyLlmBudget();
  const [usdText, setUsdText] = useState<string | null>(null);
  const [tokensText, setTokensText] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  if (!allowed) return null;
  const s = settings.data;
  const usd = usdText ?? limitText(s?.monthlyBudgetUsd);
  const tokens = tokensText ?? limitText(s?.monthlyBudgetTokens);

  const saveBudget = () => {
    setProblem(null);
    const budgetUsd = limitValue(usd);
    const budgetTokens = limitValue(tokens);
    if (budgetUsd === 'bad' || budgetTokens === 'bad') {
      setProblem(
        'Enter a number of zero or more, or leave it empty for the default.'
      );
      return;
    }
    setBudget.mutate(
      { budgetUsd, budgetTokens },
      {
        onSuccess: () => {
          setUsdText(null);
          setTokensText(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="ingest-settings">
      <AiReadingNotice />
      {settings.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(settings.error)}
        </p>
      )}
      {s && (
        <>
          <div className="flex items-center gap-3">
            <Switch
              id="ai-reading"
              checked={s.llmReadingEnabled}
              disabled={setReading.isPending}
              onCheckedChange={(checked) => setReading.mutate(checked)}
            />
            <Label htmlFor="ai-reading">
              Read tender files with the AI service
            </Label>
          </div>
          {setReading.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getErrorMessage(setReading.error)}
            </p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-usd">Monthly limit, dollars</Label>
              <Input
                id="budget-usd"
                inputMode="decimal"
                className="w-32"
                placeholder="Default"
                value={usd}
                onChange={(event) => setUsdText(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-tokens">Monthly limit, tokens</Label>
              <Input
                id="budget-tokens"
                inputMode="numeric"
                className="w-40"
                placeholder="Default"
                value={tokens}
                onChange={(event) => setTokensText(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={setBudget.isPending}
              onClick={saveBudget}
            >
              Save limits
            </Button>
          </div>
          {(problem || setBudget.isError) && (
            <p role="alert" className="text-destructive text-sm">
              {problem ?? getErrorMessage(setBudget.error)}
            </p>
          )}
          {s.recentChanges.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium">Recent changes</p>
              <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
                {s.recentChanges.map((change, index) => (
                  <li
                    // The backend sends these newest first and gives them no id.

                    key={index}
                  >
                    {change.changedAt
                      ? new Date(change.changedAt).toLocaleString('en-IN')
                      : ''}
                    : {change.setting} from {change.oldValue ?? 'default'} to{' '}
                    {change.newValue ?? 'default'}
                    {change.changedBy === undefined
                      ? ''
                      : `, by user ${change.changedBy}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
