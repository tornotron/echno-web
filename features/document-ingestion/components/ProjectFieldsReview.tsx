'use client';

import Link from 'next/link';
import type {
  Candidate,
  IngestPackage,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  INGEST_TARGET,
  isProjectFieldOnProject,
  projectFieldOf,
} from '@tornotron/echno-core/document-ingestion/types';
import { routes } from '@/nav';
import { projectFieldLabel, projectTargetFieldLabel } from '../lib/labels';
import { ApplyButton } from './ApplyButton';
import { CandidateReview, type ReviewColumn } from './CandidateReview';
import { ProvenanceList } from './ProvenanceList';
import { TenderProfileView } from './TenderProfileView';

function describe(c: Candidate): string {
  return projectFieldLabel(projectFieldOf(c).key);
}

const COLUMNS: ReviewColumn[] = [
  {
    header: 'Field',
    cell: (c) => {
      const key = projectFieldOf(c).key;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{projectFieldLabel(key)}</span>
          <span className="text-muted-foreground text-xs">
            {isProjectFieldOnProject(key) ? 'Project' : 'Tender profile'}
          </span>
        </div>
      );
    },
  },
  {
    header: 'Value',
    className: 'min-w-64',
    cell: (c) => (
      <span className="line-clamp-6 whitespace-pre-wrap">
        {projectFieldOf(c).value ?? ''}
      </span>
    ),
  },
];

/**
 * The project's facts read from the tender: the name and location go to the
 * project, every other fact to the tender profile. Applying with no project
 * on the package creates one, as upcoming, so the compliance run still waits
 * for its approval; with a project it updates that project. Each applied
 * field keeps a link to the page it was read from.
 */
export function ProjectFieldsReview({
  pkg,
  fileNames,
}: {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}) {
  const projectId = pkg.projectId;
  return (
    <div className="flex flex-col gap-6" data-testid="project-fields">
      <CandidateReview
        packageId={pkg.id}
        kind="PROJECT_FIELD"
        fileNames={fileNames}
        columns={COLUMNS}
        editFields={[
          {
            key: 'value',
            label: 'Value',
            multiline: true,
            value: (c) => projectFieldOf(c).value,
          },
        ]}
        describe={describe}
        emptyText="No project fields yet. They are read from the notice, instructions and scope once their classes are confirmed."
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          {projectId === undefined
            ? 'Applying creates the project from the accepted name and location, as upcoming, and keeps the other facts on the tender profile. Accept one value per field.'
            : 'Applying updates the project with the accepted name and location, and keeps the other facts on the tender profile.'}
        </p>
        <ApplyButton
          packageId={pkg.id}
          kind="PROJECT_FIELD"
          label={
            projectId === undefined
              ? 'Create the project'
              : 'Update the project'
          }
        />
      </div>
      {projectId !== undefined && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Project{' '}
            <Link
              className="text-primary hover:underline"
              href={routes.projects.allProjects.detail(projectId).href}
            >
              #{projectId}
            </Link>
          </p>
          <ProvenanceList
            targetType={INGEST_TARGET.PROJECT}
            targetId={String(projectId)}
            fileNames={fileNames}
            fieldLabel={projectTargetFieldLabel}
            emptyText="No field of the project came from these documents yet."
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Tender profile</p>
        <TenderProfileView packageId={pkg.id} fileNames={fileNames} />
      </div>
    </div>
  );
}
