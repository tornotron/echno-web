'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, Calendar, History, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { routes } from '@/nav';
import { useAssetMovements } from '@/hooks/assets';
import { assetMovementTypeLabels, type AssetMovement } from '@/types/resource';

/** Where an entry says the asset was, as one line: project, then store. */
function place(project?: string, location?: string): string {
  if (project && location) return `${project}, ${location}`;
  return project ?? location ?? 'Not recorded';
}

/** The document an entry came from, linked when it is a site transfer. */
function Reference({ movement }: { movement: AssetMovement }) {
  if (!movement.referenceNumber) return null;
  if (movement.siteTransferId) {
    return (
      <Link
        href={routes.resources.transfers.detail(movement.siteTransferId).href}
        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        {movement.referenceNumber}
      </Link>
    );
  }
  return <span>{movement.referenceNumber}</span>;
}

/**
 * The asset's movement ledger, newest first: every placement it has had and
 * what moved it, including the site transfers it travelled on.
 *
 * Read from `/assets/web/{id}/movements` rather than from the asset record, so
 * the history is the server's append-only ledger and not something the page
 * assembles.
 *
 * @param props.assetId - The asset whose ledger to show.
 */
export function AssetMovementHistory({ assetId }: { assetId: number }) {
  const { data, isLoading, isError } = useAssetMovements(assetId);
  const movements = data?.movements ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Movement History
        </CardTitle>
        <CardDescription>
          Every move this asset has made, newest first. Moves made on a site
          transfer link to the transfer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </p>
        ) : isError ? (
          <p className="text-sm text-red-500">
            Could not load this asset&apos;s history. Try again in a moment.
          </p>
        ) : movements.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No movements recorded yet.
          </p>
        ) : (
          <ol className="space-y-4">
            {movements.map((movement, index) => (
              <li
                key={movement.id}
                data-testid="asset-movement"
                className="relative pb-4 pl-6 last:pb-0"
              >
                {index !== movements.length - 1 && (
                  <div className="absolute top-6 bottom-0 left-2 w-px bg-zinc-200 dark:bg-zinc-700" />
                )}
                <div className="absolute top-1.5 left-0 h-4 w-4 rounded-full border-2 border-blue-500 bg-white dark:bg-zinc-900" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {assetMovementTypeLabels[movement.movementType] ??
                        movement.movementType}
                    </Badge>
                    {movement.movementType !== 'REGISTRATION' && (
                      <>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {place(
                            movement.fromProjectName,
                            movement.fromLocationName
                          )}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-400" />
                      </>
                    )}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {place(movement.toProjectName, movement.toLocationName)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {movement.reason}
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(movement.movedAt, 'MMM dd, yyyy')}
                    </span>
                    <Reference movement={movement} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        {data && data.total > movements.length && (
          <p className="text-muted-foreground mt-4 text-xs">
            Showing the latest {movements.length} of {data.total} entries.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
