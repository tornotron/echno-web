'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useExtractJobs,
  useIngestClassifications,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { isReadWorkbook } from '../lib/workbook';
import { AiReadingNotice } from './AiReadingNotice';
import { BoqApplyPanel } from './BoqApplyPanel';
import { BoqReviewGrid } from './BoqReviewGrid';
import { BoqWorkbook } from './BoqWorkbook';
import {
  CLASSIFICATION_PAGE_SIZE,
  ClassConfirmation,
} from './ClassConfirmation';
import { ContractReview } from './ContractReview';
import { CorrigendumReview } from './CorrigendumReview';
import { DrawingRegister } from './DrawingRegister';
import { IngestDocumentsTable, IngestUpload } from './IngestDocuments';
import { LlmSpendPanel } from './LlmSpendPanel';
import { MilestonesReview } from './MilestonesReview';
import { ProjectFieldsReview } from './ProjectFieldsReview';
import { QualificationReview } from './QualificationReview';
import { QualityReview } from './QualityReview';
import { UnreadPagesBanner } from './UnreadPagesBanner';

/**
 * One package, in tabs in the order a person works: upload the files and
 * confirm what each one is, then review what was read from them, kind by
 * kind, each value beside its source, and apply what was accepted. The
 * banner above the tabs names every page that was not read.
 */
export function IngestPackageDetail({ packageId }: { packageId: string }) {
  const pkg = useIngestPackage(packageId);
  const documents = useIngestDocuments(packageId, { size: 100 });
  const classifications = useIngestClassifications(packageId, {
    size: CLASSIFICATION_PAGE_SIZE,
  });
  const jobs = useExtractJobs(packageId, { size: 200 });
  const { data: projects = [] } = useProjects();

  const docs = useMemo(() => documents.data?.content ?? [], [documents.data]);
  const fileNames = useMemo(
    () => Object.fromEntries(docs.map((doc) => [doc.id, doc.fileName])),
    [docs]
  );
  const workbooks = docs.filter((doc) => isReadWorkbook(doc));
  const classes = useMemo(
    () => classifications.data?.content ?? [],
    [classifications.data]
  );
  const jobList = useMemo(() => jobs.data?.content ?? [], [jobs.data]);

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

      <AiReadingNotice />
      <UnreadPagesBanner classifications={classes} jobs={jobList} />

      <Tabs defaultValue="files">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="files">Files and classes</TabsTrigger>
          <TabsTrigger value="boq">BOQ</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="drawings">Drawings</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
          <TabsTrigger value="changes">Corrigendum</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Files</CardTitle>
              <CardDescription>
                Upload the tender files. Each is read in the background, and
                this list updates as reading goes on.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <IngestUpload packageId={current.id} />
              {documents.isError && (
                <p role="alert" className="text-destructive text-sm">
                  {getErrorMessage(documents.error)}
                </p>
              )}
              {jobs.isError && (
                <p role="alert" className="text-destructive text-sm">
                  {getErrorMessage(jobs.error)}
                </p>
              )}
              {documents.data && (
                <IngestDocumentsTable
                  documents={docs}
                  classifications={classes}
                  jobs={jobList}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classes</CardTitle>
              <CardDescription>
                Confirm what each file is, and split a file that holds several
                documents into page ranges. Nothing is read from a file until
                its class is confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassConfirmation packageId={current.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI reading spent</CardTitle>
            </CardHeader>
            <CardContent>
              <LlmSpendPanel packageId={current.id} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boq" className="mt-4 flex flex-col gap-6">
          {workbooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sheets and columns</CardTitle>
                <CardDescription>
                  Confirm which row holds the headings and which column holds
                  each field, then read each sheet.
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
              <CardTitle className="text-base">Review rows</CardTitle>
              <CardDescription>
                Each row shows the file, sheet and row it came from. Hover a
                value for its cell, or show the cells of a row.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BoqReviewGrid packageId={current.id} fileNames={fileNames} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Write to a contract</CardTitle>
              <CardDescription>
                Only rows you accepted are written. Nothing reaches a contract
                before you press apply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BoqApplyPanel pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project fields</CardTitle>
              <CardDescription>
                Facts read from the notice, instructions and scope, each beside
                the page it was read from.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectFieldsReview pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Milestones</CardTitle>
              <CardDescription>
                The milestone schedule, checked for percentages that do not add
                up to 100 and dates out of order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MilestonesReview pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Contract and obligations
              </CardTitle>
              <CardDescription>
                Terms and obligations read from the conditions of contract and
                the contract data. Where the special conditions change a general
                one, the special value is the one proposed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractReview pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drawings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Drawings</CardTitle>
              <CardDescription>
                Number, title and revision read from each sheet&apos;s title
                block, with the crop it was read from.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DrawingRegister pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Inspection and test plan
              </CardTitle>
              <CardDescription>
                Tests, frequencies and acceptance criteria read from the
                specification. Applied rows can be copied to a checklist
                template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityReview pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualification" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qualification</CardTitle>
              <CardDescription>
                What the tender asks a bidder to have, compared with the company
                profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualificationReview pkg={current} fileNames={fileNames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Corrigendum</CardTitle>
              <CardDescription>
                Changes from a corrigendum or a revised file, with the money
                they move. A record edited by hand is never overwritten without
                your choice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CorrigendumReview
                pkg={current}
                documents={docs}
                fileNames={fileNames}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
