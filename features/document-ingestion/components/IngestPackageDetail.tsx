'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useIngestDocuments,
  useIngestPackage,
} from '@tornotron/echno-core/document-ingestion/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { isReadWorkbook } from '../lib/workbook';
import { BoqApplyPanel } from './BoqApplyPanel';
import { BoqReviewGrid } from './BoqReviewGrid';
import { BoqWorkbook } from './BoqWorkbook';
import { IngestDocumentsTable, IngestUpload } from './IngestDocuments';

/**
 * One package, top to bottom in the order a person works: upload the
 * workbook, map and read its sheets, review the rows against their cells,
 * then write the accepted rows to a contract.
 */
export function IngestPackageDetail({ packageId }: { packageId: string }) {
  const pkg = useIngestPackage(packageId);
  const documents = useIngestDocuments(packageId, { size: 100 });
  const { data: projects = [] } = useProjects();

  const docs = useMemo(() => documents.data?.content ?? [], [documents.data]);
  const fileNames = useMemo(
    () => Object.fromEntries(docs.map((doc) => [doc.id, doc.fileName])),
    [docs]
  );
  const workbooks = docs.filter((doc) => isReadWorkbook(doc));

  if (pkg.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading
      </div>
    );
  }
  if (pkg.isError || !pkg.data) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(pkg.error)}
      </p>
    );
  }
  const current = pkg.data;
  const project = projects.find((p) => p.id === current.projectId);

  return (
    <div className="flex flex-col gap-6" data-testid="ingest-package">
      <div>
        <h2 className="text-lg font-semibold">{current.name}</h2>
        <p className="text-muted-foreground text-sm">
          {project ? `Project ${project.projectName}` : 'No project'}
          {current.stage === 'AWARDED' ? ', awarded' : ', tender'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Files</CardTitle>
          <CardDescription>
            Upload the BOQ workbook. It is read in the background, and this list
            updates when reading is done.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <IngestUpload packageId={current.id} />
          {documents.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getErrorMessage(documents.error)}
            </p>
          )}
          {documents.data && <IngestDocumentsTable documents={docs} />}
        </CardContent>
      </Card>

      {workbooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Sheets and columns</CardTitle>
            <CardDescription>
              Confirm which row holds the headings and which column holds each
              field, then read each sheet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {workbooks.map((doc) => (
              <BoqWorkbook key={doc.id} document={doc} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Review rows</CardTitle>
          <CardDescription>
            Each row shows the file, sheet and row it came from. Hover a value
            for its cell, or show the cells of a row.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BoqReviewGrid packageId={current.id} fileNames={fileNames} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Write to a contract</CardTitle>
          <CardDescription>
            Only rows you accepted are written. Nothing reaches a contract
            before you press apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BoqApplyPanel pkg={current} fileNames={fileNames} />
        </CardContent>
      </Card>
    </div>
  );
}
