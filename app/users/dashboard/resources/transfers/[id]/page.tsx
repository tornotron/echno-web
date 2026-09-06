'use client';

import { use, useCallback, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { useSiteTransfer } from '@tornotron/echno-core/site-transfers/hooks';
import {
  siteTransferStatusLabels,
  siteTransferStatusBadgeColors,
} from '@tornotron/echno-core/site-transfers/types';
import {
  CancelTransferDialog,
  ReceiveTransferDialog,
  SiteTransferItemsCard,
  SiteTransferLocationsCard,
  TransferInTransitNotice,
  TransferOverReceiptDialog,
  TransferStatusTrail,
} from '@/features/site-transfers/components';
import {
  useSiteTransferCancellation,
  useSiteTransferReceipt,
} from '@/features/site-transfers/hooks';
import {
  canCancel,
  canReceive,
  totalInTransit,
} from '@/lib/inventory/site-transfer-legs';

export default function SiteTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);

  const { data: transfer, isLoading } = useSiteTransfer(id);

  const [receiving, setReceiving] = useState(false);

  const closeReceiveForm = useCallback(() => setReceiving(false), []);
  const {
    fileReceipt,
    refusal,
    acknowledgeOverReceipt,
    dismissRefusal,
    isPending: isFiling,
  } = useSiteTransferReceipt(id, closeReceiveForm);

  const cancellation = useSiteTransferCancellation(id);

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

  const offerReceive = canReceive(transfer);
  const offerCancel = canCancel(transfer);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ReceiveTransferDialog
        open={receiving}
        onOpenChange={setReceiving}
        transfer={transfer}
        onFile={fileReceipt}
        isPending={isFiling}
      />

      <TransferOverReceiptDialog
        open={refusal !== null}
        onOpenChange={(open) => {
          if (!open) dismissRefusal();
        }}
        explanation={refusal?.explanation ?? ''}
        onAcknowledge={acknowledgeOverReceipt}
        isPending={isFiling}
      />

      <CancelTransferDialog
        open={cancellation.isOpen}
        onOpenChange={(open) =>
          open ? cancellation.open() : cancellation.close()
        }
        returningQuantity={totalInTransit(transfer)}
        isPending={cancellation.isPending}
        onCancelTransfer={cancellation.cancelTransfer}
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
            {offerReceive && (
              <Button
                size="sm"
                disabled={isFiling}
                onClick={() => setReceiving(true)}
              >
                Record what arrived
              </Button>
            )}
            {offerCancel && (
              <Button
                size="sm"
                variant="outline"
                disabled={cancellation.isPending}
                onClick={cancellation.open}
              >
                Cancel transfer
              </Button>
            )}
          </>
        }
      />

      <TransferInTransitNotice transfer={transfer} />

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
      <TransferStatusTrail transferId={id} />
    </div>
  );
}
