'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useCreateIngestPackage,
  useIngestPackages,
} from '@tornotron/echno-core/document-ingestion/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { routes } from '@/nav';
import { SELECT_CLASS } from '../lib/styles';

const PAGE_SIZE = 20;

/** The packages of the organization, newest first, with a form to start one. */
export function IngestPackagesList() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error } = useIngestPackages({
    page,
    size: PAGE_SIZE,
  });
  const { data: projects = [] } = useProjects();
  const projectName = useMemo(() => {
    const byId = new Map(projects.map((p) => [p.id, p.projectName]));
    return (id: number | undefined) =>
      id === undefined ? 'No project' : (byId.get(id) ?? `#${id}`);
  }, [projects]);

  return (
    <div className="flex flex-col gap-6" data-testid="ingest-packages">
      <NewPackageForm />
      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading
        </div>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(error)}
        </p>
      )}
      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Files</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No packages yet. Start one above to upload tender files.
                  </TableCell>
                </TableRow>
              )}
              {data.content.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <Link
                      href={routes.documentIngestion.detail(pkg.id).href}
                      className="font-medium hover:underline"
                    >
                      {pkg.name}
                    </Link>
                  </TableCell>
                  <TableCell>{projectName(pkg.projectId)}</TableCell>
                  <TableCell className="text-right">
                    {pkg.documentCount}
                  </TableCell>
                  <TableCell>{pkg.createdAt?.slice(0, 10) ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span>
                Page {data.page + 1} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NewPackageForm() {
  const router = useRouter();
  const create = useCreateIngestPackage();
  const { data: projects = [] } = useProjects();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const pkg = await create.mutateAsync({
      name: trimmed,
      projectId: projectId ? Number(projectId) : undefined,
    });
    setName('');
    setProjectId('');
    if (pkg) router.push(routes.documentIngestion.detail(pkg.id).href);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New package</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            submit(event).catch(() => {});
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-name">Name</Label>
            <Input
              id="package-name"
              value={name}
              placeholder="Tower C civil works tender"
              onChange={(event) => setName(event.target.value)}
              className="w-72"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-project">Project (optional)</Label>
            <select
              id="package-project"
              className={SELECT_CLASS}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">No project yet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={!name.trim() || create.isPending}>
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Start package
          </Button>
        </form>
        {create.isError && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {getErrorMessage(create.error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
