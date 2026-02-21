import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types/project';

interface CurrentProjectsCardProps {
  employeeProjects: Project[] | undefined;
  projectsLoading: boolean;
}

export function CurrentProjectsCard({
  employeeProjects,
  projectsLoading,
}: CurrentProjectsCardProps) {
  const renderProjects = () => {
    if (projectsLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      );
    }

    if (employeeProjects && employeeProjects.length > 0) {
      return (
        <div className="space-y-3">
          {employeeProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="mb-2 flex items-start justify-between">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {project.projectName}
                </h4>
                <Badge variant="outline">{project.status}</Badge>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {project.projectAddress}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <p className="text-sm text-zinc-400 italic dark:text-zinc-500">
        No projects assigned
      </p>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Projects</CardTitle>
        <CardDescription>Active project assignments</CardDescription>
      </CardHeader>
      <CardContent>{renderProjects()}</CardContent>
    </Card>
  );
}
