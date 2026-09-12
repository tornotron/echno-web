'use client';

import { useState } from 'react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { AddObservationDialog } from '@/features/inspections/components/add-observation-dialog';
import { ObservationQueue } from '@/features/inspections/components/observation-queue';

/**
 * The observation queue: findings from people, models and devices on one
 * project, pending first. A reviewer decides on each from the drawer.
 */
export default function ObservationsPage() {
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<number | undefined>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Observations"
        description="What was seen on site, by whom or what, and what it became."
        actions={<AddObservationDialog projectId={projectId} />}
      />
      <div className="space-y-1">
        <Label htmlFor="observation-project">Project</Label>
        <Select
          value={projectId === undefined ? '' : String(projectId)}
          onValueChange={(value) => setProjectId(Number(value))}
        >
          <SelectTrigger id="observation-project" className="w-72">
            <SelectValue placeholder="Choose a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.projectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ObservationQueue projectId={projectId} />
    </div>
  );
}
