'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useExtractBoqSheet } from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  BoqField,
  BoqMappingRequest,
  BoqSheet,
} from '@tornotron/echno-core/document-ingestion/types';
import { BOQ_FIELDS } from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils';
import { previewColumns } from '../lib/cells';
import { boqFieldLabels } from '../lib/labels';
import { SELECT_CLASS } from '../lib/styles';

interface BoqSheetMappingProps {
  documentId: string;
  sheet: BoqSheet;
  /** Called with the sheet as read, once reading succeeds. */
  onRead?: (sheet: BoqSheet) => void;
}

/**
 * One sheet's column mapping. Opens on the header row and columns the backend
 * proposed, shows the top of the sheet with that row marked, and lets the
 * person change the header row, pick the column for each field and add a code
 * prefix before reading the sheet into rows.
 */
export function BoqSheetMapping({
  documentId,
  sheet,
  onRead,
}: BoqSheetMappingProps) {
  const extract = useExtractBoqSheet();
  const firstRow = sheet.preview[0]?.row ?? 1;
  const [headerRow, setHeaderRow] = useState<number>(
    sheet.headerRow && sheet.headerRow > 0 ? sheet.headerRow : firstRow
  );
  const [columns, setColumns] = useState<Partial<Record<BoqField, number>>>(
    sheet.columns
  );
  const [codePrefix, setCodePrefix] = useState(sheet.codePrefix ?? '');

  const available = useMemo(
    () => previewColumns(sheet.preview, headerRow),
    [sheet.preview, headerRow]
  );
  const fieldOfColumn = useMemo(() => {
    const byCol = new Map<number, BoqField>();
    for (const field of BOQ_FIELDS) {
      const col = columns[field];
      if (col !== undefined) byCol.set(col, field);
    }
    return byCol;
  }, [columns]);

  const missingDescription = columns.description === undefined;

  const read = async () => {
    const mapping: BoqMappingRequest = { headerRow, columns: {} };
    for (const field of BOQ_FIELDS) {
      const col = columns[field];
      if (col !== undefined) mapping.columns[field] = col;
    }
    const prefix = codePrefix.trim();
    if (prefix) mapping.codePrefix = prefix;
    const result = await extract.mutateAsync({
      documentId,
      sheetId: sheet.id,
      mapping,
    });
    if (result) onRead?.(result);
  };

  return (
    <div
      className="flex flex-col gap-4"
      data-testid={`boq-mapping-${sheet.id}`}
    >
      <p className="text-muted-foreground text-sm">
        {sheet.status === 'DETECTED'
          ? 'The header row and columns below were found automatically. Check them, then read the sheet.'
          : 'No header row was found with confidence. Pick the header row and the column for each field.'}
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`header-row-${sheet.id}`}>Header row</Label>
          <select
            id={`header-row-${sheet.id}`}
            className={SELECT_CLASS}
            value={headerRow}
            onChange={(event) => setHeaderRow(Number(event.target.value))}
          >
            {sheet.preview.map((row) => (
              <option key={row.row} value={row.row}>
                Row {row.row}
              </option>
            ))}
          </select>
        </div>
        {BOQ_FIELDS.map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <Label htmlFor={`col-${sheet.id}-${field}`}>
              {boqFieldLabels[field]}
              {field === 'description' && ' (required)'}
            </Label>
            <select
              id={`col-${sheet.id}-${field}`}
              className={SELECT_CLASS}
              value={columns[field] ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setColumns((current) => {
                  const next = { ...current };
                  if (value === '') delete next[field];
                  else next[field] = Number(value);
                  return next;
                });
              }}
            >
              <option value="">Not in this sheet</option>
              {available.map((column) => (
                <option key={column.col} value={column.col}>
                  {column.heading
                    ? `${column.letter}: ${column.heading}`
                    : column.letter}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`prefix-${sheet.id}`}>Code prefix (optional)</Label>
          <Input
            id={`prefix-${sheet.id}`}
            value={codePrefix}
            placeholder="CIV-"
            className="w-28"
            onChange={(event) => setCodePrefix(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-12 px-2 py-1 text-left font-medium">Row</th>
              {available.map((column) => {
                const mapped = fieldOfColumn.get(column.col);
                return (
                  <th
                    key={column.col}
                    className="px-2 py-1 text-left font-medium"
                  >
                    {column.letter}
                    {mapped && (
                      <Badge variant="secondary" className="ml-1">
                        {boqFieldLabels[mapped]}
                      </Badge>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sheet.preview.map((row) => {
              const isHeader = row.row === headerRow;
              const byCol = new Map(row.cells.map((c) => [c.col, c]));
              return (
                <tr
                  key={row.row}
                  data-header={isHeader ? 'true' : undefined}
                  className={cn(
                    'border-t',
                    isHeader &&
                      'bg-amber-50 font-semibold dark:bg-amber-500/10',
                    row.hidden && 'text-muted-foreground italic'
                  )}
                >
                  <td className="px-2 py-1">
                    {row.row}
                    {row.hidden && ' (hidden)'}
                  </td>
                  {available.map((column) => {
                    const cell = byCol.get(column.col);
                    return (
                      <td
                        key={column.col}
                        className="max-w-64 truncate px-2 py-1"
                        title={
                          cell?.ref ? `${cell.ref}: ${cell.text}` : undefined
                        }
                      >
                        {cell?.text ?? ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={missingDescription || extract.isPending}
          onClick={() => {
            read().catch(() => {});
          }}
        >
          {extract.isPending && <Loader2 className="size-4 animate-spin" />}
          Read sheet
        </Button>
        {missingDescription && (
          <span className="text-muted-foreground text-sm">
            Pick the description column to read this sheet.
          </span>
        )}
        {sheet.status === 'EXTRACTED' && (
          <span className="text-muted-foreground text-sm">
            Reading again replaces this sheet&apos;s rows that are not applied
            yet.
          </span>
        )}
      </div>
      {extract.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(extract.error)}
        </p>
      )}
    </div>
  );
}
