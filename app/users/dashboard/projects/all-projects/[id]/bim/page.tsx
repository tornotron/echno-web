'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useBimModels } from '@tornotron/echno-core/bim/hooks';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { BimViewer, ProjectBimTab } from '@/features/bim/components';
import {
  BIM_ELEMENT_PARAM,
  BIM_MODEL_PARAM,
  BIM_STOREY_PARAM,
} from '@/lib/bim/show-in-model-href';
import { routes } from '@/nav';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectBimPage({ params }: PageProps) {
  const { id } = use(params);
  const projectId = Number.parseInt(id);
  const search = useSearchParams();
  const { data: project } = useProject(projectId);
  const { data: models } = useBimModels(projectId);
  const [manage, setManage] = useState(false);
  const [chosen, setChosen] = useState<string | undefined>(
    search.get(BIM_MODEL_PARAM) ?? undefined
  );

  const viewable = useMemo(
    () => (models ?? []).filter((m) => !!m.currentVersionId),
    [models]
  );
  const model = viewable.find((m) => m.id === chosen) ?? viewable[0];
  const showManage = manage || (models !== undefined && !model);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`${project?.projectName ?? 'Project'} - BIM`}
        description="Browse the model by storey, pick an element, see what was inspected on it"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {viewable.length > 1 && (
              <Select value={model?.id} onValueChange={setChosen}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {viewable.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={() => setManage((m) => !m)}>
              <Settings2 className="size-4" />
              {showManage && model ? 'Back to viewer' : 'Models and uploads'}
            </Button>
            <Button asChild variant="outline">
              <Link href={routes.projects.allProjects.detail(projectId).href}>
                <ArrowLeft className="size-4" />
                Project
              </Link>
            </Button>
          </div>
        }
      />

      {showManage || !model ? (
        <ProjectBimTab projectId={projectId} />
      ) : (
        <BimViewer
          projectId={projectId}
          modelId={model.id}
          versionId={model.currentVersionId as string}
          initialElement={search.get(BIM_ELEMENT_PARAM) ?? undefined}
          initialStorey={search.get(BIM_STOREY_PARAM) ?? undefined}
        />
      )}
    </div>
  );
}
