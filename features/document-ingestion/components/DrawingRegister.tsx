'use client';

import { useState } from 'react';
import {
  useDrawingRevisions,
  useDrawings,
  useTitleBlockImage,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  Candidate,
  DrawingEntry,
  IngestPackage,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  drawingOf,
  hasFlag,
  INGEST_FLAG,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { ApplyButton } from './ApplyButton';
import {
  CandidateReview,
  type EditField,
  type ReviewColumn,
} from './CandidateReview';
import { CELL, ErrorLine, Loading, RegisterTable } from './RegisterParts';

/** Drawings are listed this many to a page. */
export const DRAWING_PAGE_SIZE = 200;

const COLUMNS: ReviewColumn[] = [
  {
    header: 'Number',
    className: 'min-w-32',
    cell: (c) => (
      <div className="flex flex-col">
        <span>{drawingOf(c).drawingNumber ?? ''}</span>
        {hasFlag(c, INGEST_FLAG.NUMBER_FROM_FILE_NAME) && (
          <span className="text-muted-foreground text-xs">
            Taken from the file name
          </span>
        )}
      </div>
    ),
  },
  {
    header: 'Title',
    className: 'min-w-48',
    cell: (c) => drawingOf(c).title ?? '',
  },
  { header: 'Revision', cell: (c) => drawingOf(c).revision ?? '' },
  { header: 'Date', cell: (c) => drawingOf(c).date ?? '' },
  { header: 'Scale', cell: (c) => drawingOf(c).scale ?? '' },
];

const EDIT_FIELDS: EditField[] = [
  {
    key: 'drawing_number',
    label: 'Number',
    value: (c) => drawingOf(c).drawingNumber,
  },
  { key: 'title', label: 'Title', value: (c) => drawingOf(c).title },
  { key: 'revision', label: 'Revision', value: (c) => drawingOf(c).revision },
  { key: 'date', label: 'Date', value: (c) => drawingOf(c).date },
  { key: 'scale', label: 'Scale', value: (c) => drawingOf(c).scale },
];

function describe(c: Candidate): string {
  return drawingOf(c).drawingNumber ?? 'drawing';
}

/**
 * The title block of one sheet as it was cropped from the page, so a person
 * checks the number and revision against the drawing itself. A sheet with no
 * crop (a CAD file, or a page whose title block was not found) says so.
 */
export function TitleBlockCrop({ drawing }: { drawing: DrawingEntry }) {
  const page = drawing.cropAvailable ? drawing.sheetPage : undefined;
  const { data, isLoading, isError, error } = useTitleBlockImage(
    page === undefined ? undefined : drawing.documentId,
    page
  );
  if (page === undefined) {
    return (
      <p className="text-muted-foreground text-sm">
        No title block crop for this sheet.
      </p>
    );
  }
  if (isLoading) return <Loading text="Loading the title block" />;
  if (isError) return <ErrorLine error={error} />;
  if (!data) {
    return (
      <p className="text-muted-foreground text-sm">
        No title block crop for this sheet.
      </p>
    );
  }
  return (
    // A signed link that lasts a minute, so next/image's loader cannot hold it.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={data.url}
      alt={`Title block of drawing ${drawing.drawingNumber}`}
      className="max-h-64 w-full rounded-md border object-contain"
    />
  );
}

/** The revision date as printed, else as parsed, else empty; a blank printed date falls through. */
function revisionDate(d: DrawingEntry): string {
  return d.revisionDateText || d.revisionDate || '';
}

function DrawingDetail({ drawing }: { drawing: DrawingEntry }) {
  const revisions = useDrawingRevisions(drawing.id);
  return (
    <div
      className="flex flex-col gap-3 rounded-md border p-3"
      data-testid="drawing-detail"
    >
      <p className="text-sm font-medium">
        {drawing.drawingNumber}
        {drawing.title ? `, ${drawing.title}` : ''}
      </p>
      <TitleBlockCrop drawing={drawing} />
      {drawing.revisionHistory.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Revision table on the sheet</p>
          <ul className="flex flex-col gap-0.5 text-sm">
            {drawing.revisionHistory.map((note, i) => (
              <li key={`${note.revision ?? ''}-${i}`}>
                {[note.revision, note.date, note.description]
                  .filter(Boolean)
                  .join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Revisions in this package</p>
        {revisions.isLoading && <Loading text="Loading the revisions" />}
        {revisions.isError && <ErrorLine error={revisions.error} />}
        {revisions.data && (
          <ul className="flex flex-col gap-0.5 text-sm">
            {revisions.data.map((rev) => (
              <li key={rev.id}>
                {rev.revision ? `Revision ${rev.revision}` : 'No revision'}
                {revisionDate(rev) ? `, ${revisionDate(rev)}` : ''}
                {rev.current ? ', current' : ', replaced'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * The drawing register: one row per sheet, the current revision by default.
 * A sheet whose title block could not be read is listed as not read, so it
 * is never mistaken for one that is missing.
 */
export function DrawingsList({ packageId }: { packageId: string }) {
  const [currentOnly, setCurrentOnly] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useDrawings(packageId, {
    currentOnly,
    size: DRAWING_PAGE_SIZE,
  });
  const rows = data?.content ?? [];
  const chosen = rows.find((d) => d.id === selected);

  return (
    <div className="flex flex-col gap-3" data-testid="drawing-register">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={currentOnly}
          onChange={(e) => setCurrentOnly(e.target.checked)}
        />
        Current revisions only
      </label>
      {isLoading && <Loading text="Loading the drawings" />}
      {isError && <ErrorLine error={error} />}
      {data && rows.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No drawings are applied yet. They appear here once you apply the
          accepted ones.
        </p>
      )}
      {rows.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <RegisterTable
            headers={[
              'Number',
              'Title',
              'Discipline',
              'Revision',
              'Date',
              'State',
              '',
            ]}
          >
            {rows.map((d) => (
              <tr key={d.id} className="border-t">
                <td className={CELL}>{d.drawingNumber}</td>
                <td className={CELL}>{d.title ?? ''}</td>
                <td className={CELL}>{d.discipline ?? ''}</td>
                <td className={CELL}>{d.revision ?? ''}</td>
                <td className={CELL}>{revisionDate(d)}</td>
                <td className={CELL}>
                  <div className="flex flex-wrap gap-1">
                    {d.status === 'NOT_READ' && (
                      <Badge variant="amber">Not read</Badge>
                    )}
                    {d.current ? (
                      <Badge variant="secondary">Current</Badge>
                    ) : (
                      <Badge variant="outline">Replaced</Badge>
                    )}
                  </div>
                  {d.note && (
                    <span className="text-muted-foreground text-xs">
                      {d.note}
                    </span>
                  )}
                </td>
                <td className={CELL}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Show drawing ${d.drawingNumber}`}
                    onClick={() => setSelected(d.id)}
                  >
                    Show
                  </Button>
                </td>
              </tr>
            ))}
          </RegisterTable>
          {chosen ? (
            <DrawingDetail drawing={chosen} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Pick a drawing to see its title block and revisions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** The drawings tab: review each sheet's title block values, apply, then read the register. */
export function DrawingRegister({
  pkg,
  fileNames,
}: {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="drawings">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Title blocks to review</h3>
        <CandidateReview
          packageId={pkg.id}
          kind="DRAWING"
          fileNames={fileNames}
          columns={COLUMNS}
          editFields={EDIT_FIELDS}
          describe={describe}
          emptyText="No drawings yet. Title blocks are read from drawing files once their class is confirmed."
          testId="drawing-review"
        />
        <ApplyButton packageId={pkg.id} kind="DRAWING" label="Apply drawings" />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Drawing register</h3>
        <DrawingsList packageId={pkg.id} />
      </section>
    </div>
  );
}
