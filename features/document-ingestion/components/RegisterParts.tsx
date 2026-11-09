'use client';

import { useState, type ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import type { RaisedRisk } from '@tornotron/echno-core/document-ingestion/types';
import { Button } from '@/components/shadcn/button';
import { useCan } from '@/hooks/use-can';
import { INGEST_RISK_ACCESS } from '../lib/access';

/**
 * Pieces the register screens share: a loading line, an error line, a plain
 * table, and the button that raises a project risk from a register row.
 */

export function Loading({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" />
      {text}
    </div>
  );
}

export function ErrorLine({ error }: { error: unknown }) {
  return (
    <p role="alert" className="text-destructive text-sm">
      {getErrorMessage(error)}
    </p>
  );
}

export function RegisterTable({
  headers,
  children,
  testId,
}: {
  headers: string[];
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm" data-testid={testId}>
        <thead>
          <tr className="bg-muted/50 text-left">
            {headers.map((header) => (
              <th key={header} className="px-2 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const CELL = 'px-2 py-2 align-top';

/**
 * Raises a project risk from one register row, once. A row that already
 * names a risk says so in place of the button, and raising again answers
 * with the risk raised before. Hidden from a role that may not manage risks.
 */
export function RaiseRiskButton({
  riskId,
  label,
  raise,
  pending,
}: {
  riskId?: string;
  label: string;
  raise: () => Promise<RaisedRisk | undefined>;
  pending: boolean;
}) {
  const { allowed } = useCan(INGEST_RISK_ACCESS);
  const [raised, setRaised] = useState<RaisedRisk | null>(null);
  const [error, setError] = useState<unknown>(null);

  if (raised) {
    return (
      <span role="status" className="text-xs">
        {raised.created
          ? `Risk ${raised.riskNumber} raised`
          : `Already raised as ${raised.riskNumber}`}
      </span>
    );
  }
  if (riskId) {
    return <span className="text-muted-foreground text-xs">Risk raised</span>;
  }
  if (!allowed) return null;
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        aria-label={`Raise a risk: ${label}`}
        onClick={() => {
          setError(null);
          raise()
            .then((risk) => risk && setRaised(risk))
            .catch((error_: unknown) => setError(error_));
        }}
      >
        <ShieldAlert className="size-4" />
        Raise a risk
      </Button>
      {error !== null && <ErrorLine error={error} />}
    </div>
  );
}
