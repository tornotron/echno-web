'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Building2,
  ClipboardList,
  FileCheck2,
  MapPin,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useBillingOverview,
  useBillingProjects,
} from '@tornotron/echno-core/contract-billing/hooks';
import type { ProjectBillingSummary } from '@tornotron/echno-core/contract-billing/types';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Input } from '@/components/shadcn/input';
import { Progress } from '@/components/shadcn/progress';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { routes } from '@/nav';
import { formatInr, formatPercent } from '../lib/format';
import { projectLocation } from '../lib/projects';
import { BillingActivityCard } from './BillingActivityCard';
import { ProjectStateChip } from './chips';
import { ProjectStatusCard } from './ProjectStatusCard';

const PAGE_SIZE = 10;
/** The status summary counts this many projects. */
const STATUS_SAMPLE = 100;
const SEARCH_DELAY_MS = 300;

type View = 'cards' | 'table';

/**
 * The billing home page, grouped by project: the organization's figures, each
 * project with its contracts and bills added up, recent activity and the
 * projects by billing state. Contracts and bills are one level down, on the
 * project's own page.
 */
export function BillingHome() {
  const [view, setView] = useState<View>('cards');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const overview = useBillingOverview();
  const projects = useBillingProjects({
    search: search || undefined,
    pageNo: page,
    pageSize: PAGE_SIZE,
  });
  const status = useBillingProjects({ pageNo: 0, pageSize: STATUS_SAMPLE });

  const o = overview.data;
  const tiles: {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
  }[] = [
    {
      label: 'Projects in billing',
      value: String(o?.projectsInBilling ?? 0),
      hint: `${status.data?.totalElements ?? 0} projects in all`,
      icon: Building2,
    },
    {
      label: 'Bills in progress',
      value: String(o?.openBills ?? 0),
      hint: `${o?.drafts ?? 0} in draft, ${o?.returned ?? 0} returned`,
      icon: FileCheck2,
    },
    {
      label: 'Pending actions',
      value: String(o?.pendingActions ?? 0),
      hint: `${o?.awaitingApproval ?? 0} waiting for final approval`,
      icon: ClipboardList,
    },
    {
      label: 'Amount due',
      value: formatInr(o?.amountDue ?? 0),
      hint: `${formatInr(o?.paidToDate ?? 0)} paid to date`,
      icon: Banknote,
    },
  ];

  const rows = projects.data?.content ?? [];
  const totalPages = projects.data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      {overview.isError ? (
        <p role="alert" className="text-destructive text-sm">
          Could not load the billing figures: {getErrorMessage(overview.error)}
        </p>
      ) : (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="billing-overview"
        >
          {tiles.map((tile) => (
            <Card key={tile.label} className="py-4">
              <CardContent className="flex items-start gap-3 px-4">
                <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                  <tile.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm">{tile.label}</p>
                  {overview.isPending ? (
                    <Skeleton className="mt-1 h-7 w-24" />
                  ) : (
                    <p className="truncate text-xl font-semibold">
                      {tile.value}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">{tile.hint}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Open a project to see its contracts and bills.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search
                  className="text-muted-foreground absolute top-2.5 left-2.5 size-4"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Search projects by name"
                  placeholder="Search projects"
                  className="pl-8 sm:w-56"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <div
                className="flex gap-1"
                role="group"
                aria-label="How to show the projects"
              >
                <Button
                  size="sm"
                  variant={view === 'cards' ? 'default' : 'outline'}
                  aria-pressed={view === 'cards'}
                  onClick={() => setView('cards')}
                >
                  Card view
                </Button>
                <Button
                  size="sm"
                  variant={view === 'table' ? 'default' : 'outline'}
                  aria-pressed={view === 'table'}
                  onClick={() => setView('table')}
                >
                  Table view
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.isPending && <Skeleton className="h-64 w-full" />}
            {projects.isError && (
              <Empty variant="error">
                <EmptyErrorMedia>
                  <FileCheck2 className="size-6" />
                </EmptyErrorMedia>
                <EmptyHeader>
                  <EmptyTitle>Could not load the projects</EmptyTitle>
                  <EmptyDescription>
                    {getErrorMessage(projects.error)}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {!projects.isPending && !projects.isError && rows.length === 0 && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {search ? 'No project by that name' : 'No projects yet'}
                  </EmptyTitle>
                  <EmptyDescription>
                    {search
                      ? 'Try part of the name.'
                      : 'Billing is grouped by project. Add a project and a sub-contract on it to start billing.'}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {rows.length > 0 &&
              (view === 'cards' ? (
                <ul className="space-y-3">
                  {rows.map((row) => (
                    <ProjectCard key={row.projectId} row={row} />
                  ))}
                </ul>
              ) : (
                <ProjectTable rows={rows} />
              ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <BillingActivityCard />
          {status.data && <ProjectStatusCard projects={status.data.content} />}
        </div>
      </div>
    </div>
  );
}

function projectHref(row: ProjectBillingSummary): string {
  return routes.inspections.billing.projects.detail(row.projectId).href;
}

/** What the project's row can say about its contracts and bills in a few words. */
function billFacts(row: ProjectBillingSummary): string[] {
  if (row.contractCount === 0) return ['No contracts yet'];
  return [
    `${row.contractCount} ${row.contractCount === 1 ? 'contract' : 'contracts'}`,
    `${row.openBills} open ${row.openBills === 1 ? 'bill' : 'bills'}`,
    `${row.awaitingSignature} awaiting signature`,
  ];
}

function ProjectCard({ row }: { row: ProjectBillingSummary }) {
  const location = projectLocation(row);
  return (
    <li className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-md">
          <Building2 className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <Link
            className="block truncate font-medium hover:underline"
            href={projectHref(row)}
          >
            {row.projectName}
          </Link>
          {location && (
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <MapPin className="size-3" aria-hidden="true" />
              {location}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            {billFacts(row).join(' · ')}
          </p>
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Contract value</p>
        <p className="font-medium">{formatInr(row.contractValue)}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Certified</p>
        <p className="font-medium">{formatPercent(row.billedPercent)}</p>
        <Progress
          aria-label={`Certified share of ${row.projectName}`}
          value={Math.min(row.billedPercent ?? 0, 100)}
          className="mt-1 h-1.5"
        />
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Amount due</p>
        <p className="font-medium">{formatInr(row.amountDue)}</p>
        <ProjectStateChip state={row.billingState} />
      </div>
      <Button asChild size="sm">
        <Link href={projectHref(row)}>
          Open project
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </li>
  );
}

function ProjectTable({ rows }: { rows: ProjectBillingSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead className="text-right">Contract value</TableHead>
          <TableHead className="text-right">Certified</TableHead>
          <TableHead className="text-right">Open bills</TableHead>
          <TableHead className="text-right">Awaiting signature</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Due</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.projectId}>
            <TableCell>
              <Link
                className="font-medium hover:underline"
                href={projectHref(row)}
              >
                {row.projectName}
              </Link>
              <p className="text-muted-foreground text-xs">
                {projectLocation(row)}
              </p>
            </TableCell>
            <TableCell className="text-right">
              {formatInr(row.contractValue)}
            </TableCell>
            <TableCell className="text-right">
              {formatInr(row.certifiedToDate)}
              <p className="text-muted-foreground text-xs">
                {formatPercent(row.billedPercent)}
              </p>
            </TableCell>
            <TableCell className="text-right">{row.openBills}</TableCell>
            <TableCell className="text-right">
              {row.awaitingSignature}
            </TableCell>
            <TableCell className="text-right">
              {formatInr(row.paidToDate)}
            </TableCell>
            <TableCell className="text-right">
              {formatInr(row.amountDue)}
            </TableCell>
            <TableCell>
              <ProjectStateChip state={row.billingState} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
