'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/shadcn/card';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import {
  Loader2,
  ArrowRightLeft,
  Package,
  CalendarDays,
  User,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useSiteTransfer,
  useDeleteSiteTransfer,
  useUpdateSiteTransferStatus,
} from '@/hooks/site-transfers';
import {
  SiteTransferStatus,
  siteTransferStatusLabels,
  siteTransferStatusBadgeColors,
} from '@/types/site-transfers';
import {
  SiteTransferConfirmDialog,
  SiteTransferItemsCard,
  SiteTransferLocationsCard,
} from '@/features/site-transfers/components';

const nextStatus: Partial<Record<SiteTransferStatus, SiteTransferStatus>> = {
  [SiteTransferStatus.pending]: SiteTransferStatus.partiallyTransferred,
  [SiteTransferStatus.partiallyTransferred]: SiteTransferStatus.completed,
};

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void;
}

export default function SiteTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: transfer, isLoading } = useSiteTransfer(id);
  const { mutate: deleteTransfer, isPending: isDeleting } =
    useDeleteSiteTransfer();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateSiteTransferStatus();

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
    onConfirm: () => {},
  });

  function requestConfirm(
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' = 'default'
  ) {
    setConfirm({ open: true, title, description, variant, onConfirm });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading transfer...
          </p>
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <ArrowRightLeft className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Transfer not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.transfers.href}>Back to Transfers</Link>
        </Button>
      </Empty>
    );
  }

  const next = nextStatus[transfer.status];

  return (
    <div className="space-y-4 sm:space-y-6">
      <SiteTransferConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((s) => ({ ...s, open }))}
        title={confirm.title}
        description={confirm.description}
        variant={confirm.variant}
        onConfirm={() => {
          setConfirm((s) => ({ ...s, open: false }));
          confirm.onConfirm();
        }}
        isPending={isDeleting || isUpdating}
      />

      {/* Header */}
      <PageHeader
        title={transfer.transferNumber}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={siteTransferStatusBadgeColors[transfer.status]}>
              {siteTransferStatusLabels[transfer.status]}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Issued {format(new Date(transfer.issueDate), 'MMM dd, yyyy')}
            </span>
          </div>
        }
        actions={
          <>
            {next && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={() =>
                  requestConfirm(
                    'Update Status',
                    `Mark this transfer as "${siteTransferStatusLabels[next]}"?`,
                    () => updateStatus({ id, status: next })
                  )
                }
              >
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Mark as {siteTransferStatusLabels[next]}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              aria-label={`Delete transfer ${transfer.transferNumber}`}
              disabled={isDeleting}
              onClick={() =>
                requestConfirm(
                  'Delete Transfer',
                  `Are you sure you want to delete ${transfer.transferNumber}? Stock that was decremented will need to be adjusted manually. This action cannot be undone.`,
                  () =>
                    deleteTransfer(id, {
                      onSuccess: () =>
                        router.push(routes.resources.transfers.href),
                    }),
                  'destructive'
                )
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Stock warning notice */}
      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Site transfers are immutable once created. Stock was decremented on
          creation. Status updates track delivery progress.
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {transfer.items.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Issue Date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CalendarDays className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {format(new Date(transfer.issueDate), 'dd MMM')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sending Person</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="min-w-0 truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {transfer.sendingPerson.name}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900/20">
                <ArrowRightLeft className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <Badge className={siteTransferStatusBadgeColors[transfer.status]}>
                {siteTransferStatusLabels[transfer.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <SiteTransferItemsCard transfer={transfer} />
      <SiteTransferLocationsCard transfer={transfer} />
    </div>
  );
}
