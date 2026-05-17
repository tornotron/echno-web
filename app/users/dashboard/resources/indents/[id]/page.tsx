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
import { useIndent, useDeleteIndent } from '@/hooks/indents';
import { indentStatusLabels, indentStatusBadgeColors } from '@/types/indents';
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
            onSuccess: () => router.push(routes.resources.indents.href),
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
                {indent.items.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Converted to PO</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <Hash className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {convertedCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expected On</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <CalendarDays className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {indent.expectedOn
                  ? format(new Date(indent.expectedOn), 'dd MMM')
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Created By</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900/20">
                <User className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <span className="min-w-0 truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {indent.createdBy.name}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <IndentItemsCard indentId={id} items={indent.items} />

      <div className="grid gap-4 md:grid-cols-2">
        <IndentInfoCard indent={indent} />
        <IndentRemarksCard indent={indent} />
      </div>
    </div>
  );
}
