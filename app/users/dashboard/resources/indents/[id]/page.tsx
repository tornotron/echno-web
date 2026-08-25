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
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  Loader2,
  Trash2,
  Package,
  CalendarDays,
  User,
  Hash,
  FolderOpen,
  ChevronDown,
  ShoppingCart,
  ArrowRightLeft,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useIndent,
  useDeleteIndent,
} from '@tornotron/echno-core/indents/hooks';
import { toast } from '@/lib/styles/toast-styles';
import {
  indentStatusLabels,
  indentStatusBadgeColors,
} from '@tornotron/echno-core/indents/types';
import {
  DeleteIndentDialog,
  IndentItemsCard,
  IndentInfoCard,
  IndentRemarksCard,
} from '@/features/indents/components';

export default function IndentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: indent, isLoading, isError } = useIndent(id);
  const { mutate: deleteIndent, isPending: isDeleting } = useDeleteIndent();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading indent...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <ClipboardList className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load indent</EmptyTitle>
          <EmptyDescription>An unexpected error occurred.</EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.indents.href}>Back to Indents</Link>
        </Button>
      </Empty>
    );
  }

  if (!indent) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <ClipboardList className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Indent not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.indents.href}>Back to Indents</Link>
        </Button>
      </Empty>
    );
  }

  const convertedCount = indent.items.filter(
    (it) => it.convertedToPurchaseOrder
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <DeleteIndentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        indentNumber={indent.indentNumber}
        onConfirm={() =>
          deleteIndent(id, {
            onSuccess: () => {
              toast.success('Indent deleted.');
              router.push(routes.resources.indents.href);
            },
            onError: (err) =>
              toast.error(
                err instanceof Error ? err.message : 'Failed to delete indent.'
              ),
          })
        }
        isPending={isDeleting}
      />

      {/* Header */}
      <PageHeader
        title={indent.indentNumber}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={indentStatusBadgeColors[indent.status]}>
              {indentStatusLabels[indent.status]}
            </Badge>
            {indent.projectName && (
              <Badge variant="outline" className="text-xs">
                <FolderOpen className="mr-1 h-3 w-3" />
                {indent.projectName}
              </Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Created {format(new Date(indent.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions <ChevronDown className="ml-1.5 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    router.push(
                      `${routes.resources.purchaseOrders.new}?fromIndent=${id}`
                    )
                  }
                >
                  <ShoppingCart className="h-4 w-4" />
                  Create Purchase Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    router.push(
                      `${routes.resources.transfers.new}?fromIndent=${id}`
                    )
                  }
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Initiate Site Transfer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              aria-label="Delete indent"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </>
        }
      />

      {/* Key Metrics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Items
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {indent.items.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Package className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              requested
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Converted to PO
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {convertedCount}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Hash className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              items ordered
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Expected On
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {indent.expectedOn
                  ? format(new Date(indent.expectedOn), 'dd MMM')
                  : '—'}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <CalendarDays className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              required by
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Created By
            </p>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {indent.createdBy?.id ? (
                  <Link
                    href={employeeFilterHref(
                      routes.resources.indents.href,
                      indent.createdBy.id,
                      'creator'
                    )}
                    className="hover:underline"
                  >
                    {indent.createdBy.name}
                  </Link>
                ) : (
                  indent.createdBy?.name
                )}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <User className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              requested by
            </p>
          </div>
        </div>
      </Card>

      <IndentItemsCard indentId={id} items={indent.items} />

      <div className="grid gap-4 md:grid-cols-2">
        <IndentInfoCard indent={indent} />
        <IndentRemarksCard indent={indent} />
      </div>
    </div>
  );
}
