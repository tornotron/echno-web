'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileInput, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useCreateIngestPackage,
  useIngestPackages,
} from '@tornotron/echno-core/document-ingestion/hooks';
import { INGEST_TARGET } from '@tornotron/echno-core/document-ingestion/types';
import { Button } from '@/components/shadcn/button';
import { routes } from '@/nav';
import { projectTargetFieldLabel } from '../lib/labels';
import { IngestionGate } from './IngestionGate';
import { ProvenanceList } from './ProvenanceList';
import { ProjectItp } from './QualityReview';

/** Packages are listed for the whole organization; this many are searched for the project's own. */
export const PROJECT_PACKAGE_SCAN = 100;

/**
 * The project's Documents tab: its document packages, an "Import from
 * documents" action that starts a package for the project, which of the
 * project's fields came from a document, each with its source, and the
 * project's ITP as read from its specifications.
 */
export function ProjectDocumentsTab({
  projectId,
  projectName,
}: {
  projectId: number;
  projectName?: string;
}) {
  return (
    <IngestionGate>
      <ProjectDocuments projectId={projectId} projectName={projectName} />
    </IngestionGate>
  );
}

function ProjectDocuments({
  projectId,
  projectName,
}: {
  projectId: number;
  projectName?: string;
}) {
  const router = useRouter();
  const packages = useIngestPackages({ size: PROJECT_PACKAGE_SCAN });
  const create = useCreateIngestPackage();
  const own = (packages.data?.content ?? []).filter(
    (p) => p.projectId === projectId
  );

  const start = () => {
    create
      .mutateAsync({
        name: `${projectName ?? `Project ${projectId}`} documents`,
        projectId,
      })
      .then((pkg) => {
        if (pkg) router.push(routes.documentIngestion.detail(pkg.id).href);
      })
      .catch(() => {});
  };

  return (
    <div className="flex flex-col gap-6" data-testid="project-documents">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={create.isPending} onClick={start}>
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileInput className="size-4" />
          )}
          Import from documents
        </Button>
        <span className="text-muted-foreground text-sm">
          Starts a package for this project, to upload its tender files.
        </span>
      </div>
      {create.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(create.error)}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Document packages</p>
        {packages.isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading
          </div>
        )}
        {packages.isError && (
          <p role="alert" className="text-destructive text-sm">
            {getErrorMessage(packages.error)}
          </p>
        )}
        {packages.data && own.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No document package for this project yet.
          </p>
        )}
        {own.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {own.map((pkg) => (
              <li key={pkg.id}>
                <Link
                  href={routes.documentIngestion.detail(pkg.id).href}
                  className="text-primary font-medium hover:underline"
                >
                  {pkg.name}
                </Link>
                <span className="text-muted-foreground">
                  {' '}
                  {pkg.documentCount === 1
                    ? '1 file'
                    : `${pkg.documentCount} files`}
                  {pkg.stage === 'AWARDED' ? ', awarded' : ', tender'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Fields read from documents</p>
        <ProvenanceList
          targetType={INGEST_TARGET.PROJECT}
          targetId={String(projectId)}
          fieldLabel={projectTargetFieldLabel}
          emptyText="No field of this project came from a document."
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Inspection and test plan</p>
        <ProjectItp projectId={projectId} />
      </div>
    </div>
  );
}
