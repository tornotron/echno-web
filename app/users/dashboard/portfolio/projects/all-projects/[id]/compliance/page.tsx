'use client';

import { use } from 'react';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common/page-header';
import { ProjectComplianceTab } from '@/features/compliance/components';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectCompliancePage({ params }: PageProps) {
  const { id } = use(params);
  const projectId = Number.parseInt(id);
  const { data: project } = useProject(projectId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`${project?.projectName ?? 'Project'} - Compliance`}
        description="AI compliance analysis for this project"
      />
      <ProjectComplianceTab projectId={projectId} />
    </div>
  );
}
