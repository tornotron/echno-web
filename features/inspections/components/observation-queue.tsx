'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ObservationReviewStatus,
  ObservationSource,
  observationReviewStatusLabels,
  observationSourceLabels,
} from '@tornotron/echno-core/inspection/types';
import type { Observation } from '@tornotron/echno-core/inspection/types';
import { useObservations } from '@/hooks/inspection';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { SpatialBreadcrumb } from '@/components/shared/spatial-breadcrumb';
import {
  ObservationConfidence,
  ObservationOutcomeBadge,
  ObservationSourceBadge,
  ObservationStatusBadge,
} from './observation-badges';
import { ObservationEvidenceStrip } from './observation-evidence';
import { ObservationReviewSheet } from './observation-review-sheet';

/** Sentinel for "no filter": Radix Select cannot hold an empty string value. */
const ALL = 'ALL';
const PAGE_SIZE = 20;

interface ObservationQueueProps {
  /** Project whose observations to list. Nothing renders until one is chosen. */
  projectId: number | undefined;
  /** Narrow to one inspection's observations (the inspection detail uses this). */
  inspectionId?: string;
  /** The status the list opens on; the review queue opens on pending. */
  initialStatus?: ObservationReviewStatus | typeof ALL;
}

/**
 * The observation queue: what a model, a device or a person recorded on the
 * project, pending first, with the review drawer on each row. The list is
 * served paged and filtered by the backend, so the filters go into the
 * query rather than over the fetched rows.
 */
export function ObservationQueue({
  projectId,
  inspectionId,
  initialStatus = ObservationReviewStatus.PENDING,
}: ObservationQueueProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [source, setSource] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Observation | null>(null);

  const { data, isLoading, isError } = useObservations({
    projectId,
    inspectionId,
    reviewStatus:
      status === ALL ? undefined : (status as ObservationReviewStatus),
    source: source === ALL ? undefined : (source as ObservationSource),
    page,
    size: PAGE_SIZE,
  });

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="observation-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
          >
            <SelectTrigger id="observation-status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {Object.values(ObservationReviewStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {observationReviewStatusLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="observation-source">Source</Label>
          <Select
            value={source}
            onValueChange={(value) => {
              setSource(value);
              setPage(0);
            }}
          >
            <SelectTrigger id="observation-source" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sources</SelectItem>
              {Object.values(ObservationSource).map((value) => (
                <SelectItem key={value} value={value}>
                  {observationSourceLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data && (
          <span className="text-muted-foreground ml-auto text-sm">
            {data.totalElements} observation
            {data.totalElements === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {projectId === undefined && !inspectionId ? (
        <p className="text-muted-foreground text-sm">
          Choose a project to see its observations.
        </p>
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">
          The observations could not be loaded.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing here. Machine findings land as pending; a person records one
          as accepted.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Observation</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Where</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Observed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((observation) => (
                <TableRow
                  key={observation.id}
                  data-testid="observation-row"
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Review ${observation.title}`}
                  onClick={() => setSelected(observation)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(observation);
                    }
                  }}
                >
                  <TableCell>
                    <div className="font-medium">{observation.title}</div>
                    {observation.description && (
                      <div className="text-muted-foreground line-clamp-2 max-w-md text-xs">
                        {observation.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <ObservationSourceBadge observation={observation} />
                      <ObservationConfidence
                        confidence={observation.confidence}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <SpatialBreadcrumb
                      path={observation.spatialPath}
                      fallback={observation.locationNote}
                    />
                  </TableCell>
                  <TableCell>
                    <ObservationEvidenceStrip
                      observation={observation}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {observation.observedAt
                      ? format(
                          new Date(observation.observedAt),
                          'dd MMM yyyy HH:mm'
                        )
                      : ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <ObservationStatusBadge
                        status={observation.reviewStatus}
                      />
                      <ObservationOutcomeBadge kind={observation.outcomeKind} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {(totalPages > 1 || page > 0) && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ObservationReviewSheet
        observation={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
