'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import { Card } from '@/components/shadcn/card';
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
} from '@tornotron/echno-core/site-transfers/hooks';
import {
  SiteTransferStatus,
  siteTransferStatusLabels,
  siteTransferStatusBadgeColors,
} from '@tornotron/echno-core/site-transfers/types';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
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
                    () =>
                      updateStatus(
                        { id, status: next },
                        {
                          onSuccess: () =>
                            toast.success('Status Updated', {
                              description:
                                'The transfer status has been updated.',
                            }),
                          onError: (err) =>
                            toast.error(
                              getErrorTitle(err, 'Failed to Update Status'),
                              { description: getErrorMessage(err) }
                            ),
                        }
                      )
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
                      onError: (err) =>
                        toast.error(
                          getErrorTitle(err, 'Delete Not Supported'),
                          { description: getErrorMessage(err) }
                        ),
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
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Items
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {transfer.items.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Package className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              line items
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Issue Date
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {format(new Date(transfer.issueDate), 'dd MMM')}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CalendarDays className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              transfer date
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sending Person
            </p>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {transfer.sendingPerson?.id ? (
                  <Link
                    href={employeeFilterHref(
                      routes.resources.transfers.href,
                      transfer.sendingPerson.id,
                      'sender'
                    )}
                    className="hover:underline"
                  >
                    {transfer.sendingPerson.name}
                  </Link>
                ) : (
                  transfer.sendingPerson?.name
                )}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <User className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              dispatched by
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
            <div className="flex items-center justify-between">
              <Badge className={siteTransferStatusBadgeColors[transfer.status]}>
                {siteTransferStatusLabels[transfer.status]}
              </Badge>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <ArrowRightLeft className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              current state
            </p>
          </div>
        </div>
      </Card>

      <SiteTransferItemsCard transfer={transfer} />
      <SiteTransferLocationsCard transfer={transfer} />
    </div>
  );
}
