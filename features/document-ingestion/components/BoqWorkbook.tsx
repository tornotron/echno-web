'use client';

import { useState } from 'react';
import { Loader2, ScanSearch } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useBoqSheets,
  useDetectBoqSheets,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  BoqSheet,
  BoqSheetSummary as Summary,
  IngestDocument,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { sheetStatusLabels } from '../lib/labels';
import { BoqSheetMapping } from './BoqSheetMapping';

/**
 * The sheets of one read workbook. Finds each sheet's header on request, then
 * shows the mapping step for a sheet not read yet and the summary for one
 * that is, with a way back to the mapping to read it again.
 */
export function BoqWorkbook({ document }: { document: IngestDocument }) {
  const { data: sheets, isLoading, isError, error } = useBoqSheets(document.id);
  const detect = useDetectBoqSheets();

  return (
    <div
      className="flex flex-col gap-4"
      data-testid={`workbook-${document.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">{document.fileName}</h3>
        <Button
          type="button"
          variant={sheets && sheets.length > 0 ? 'outline' : 'default'}
          size="sm"
          disabled={detect.isPending}
          onClick={() => detect.mutate(document.id)}
        >
          {detect.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanSearch className="size-4" />
          )}
          {sheets && sheets.length > 0
            ? 'Find the header rows again'
            : 'Find the BOQ sheets'}
        </Button>
      </div>
      {detect.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(detect.error)}
        </p>
      )}
      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading sheets
        </div>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(error)}
        </p>
      )}
      {sheets && sheets.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No sheets found yet. Find the BOQ sheets to see each sheet&apos;s
          header row and proposed columns.
        </p>
      )}
      {sheets?.map((sheet) => (
        <SheetPanel key={sheet.id} documentId={document.id} sheet={sheet} />
      ))}
    </div>
  );
}

function SheetPanel({
  documentId,
  sheet,
}: {
  documentId: string;
  sheet: BoqSheet;
}) {
  const [remap, setRemap] = useState(false);
  const read = sheet.status === 'EXTRACTED' && sheet.summary;

  return (
    <section className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-medium">Sheet {sheet.sheetName}</h4>
        <Badge variant={sheet.status === 'EXTRACTED' ? 'default' : 'outline'}>
          {sheetStatusLabels[sheet.status]}
        </Badge>
        {sheet.hidden && <Badge variant="amber">Hidden sheet</Badge>}
        <span className="text-muted-foreground text-xs">
          {sheet.rowCount} rows
        </span>
        {read && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setRemap((current) => !current)}
          >
            {remap ? 'Hide mapping' : 'Change mapping'}
          </Button>
        )}
      </div>
      {read && sheet.summary && <BoqSheetSummary summary={sheet.summary} />}
      {(!read || remap) && (
        <BoqSheetMapping
          documentId={documentId}
          sheet={sheet}
          onRead={() => setRemap(false)}
        />
      )}
    </section>
  );
}

/** What reading one sheet found: counts, warnings with their rows, and the rows set aside. */
export function BoqSheetSummary({ summary }: { summary: Summary }) {
  const counts: [string, number][] = [
    ['Rows read', summary.rowsRead],
    ['Items', summary.items],
    ['Sections', summary.sections],
    ['Totals', summary.totals],
    ['Items with flags', summary.flaggedItems],
  ];
  return (
    <div
      className="flex flex-col gap-2 text-sm"
      data-testid="boq-sheet-summary"
    >
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        {counts.map(([label, value]) => (
          <div key={label} className="flex gap-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.warnings.length > 0 && (
        <ul className="list-disc pl-5">
          {summary.warnings.map((warning, index) => (
            <li key={`${warning.code}-${warning.row ?? ''}-${index}`}>
              {warning.row !== undefined && `Row ${warning.row}: `}
              {warning.message}
            </li>
          ))}
        </ul>
      )}
      {summary.ignoredRows.length > 0 && (
        <p className="text-muted-foreground">
          Rows not read as items, sections or totals:{' '}
          {summary.ignoredRows.join(', ')}
        </p>
      )}
    </div>
  );
}
