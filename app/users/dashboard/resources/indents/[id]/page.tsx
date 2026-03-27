'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const { data: indent, isLoading } = useIndent(id);
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

  if (!indent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">Indent not found</h3>
          <Button
            onClick={() => router.push('/users/dashboard/resources/indents')}
          >
            Back to Indents
          </Button>
        </CardContent>
      </Card>
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
            onSuccess: () => router.push('/users/dashboard/resources/indents'),
          })
        }
        isPending={isDeleting}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {indent.indentNumber}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
        </div>
        <div className="flex shrink-0 gap-2">
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
                    `/users/dashboard/resources/purchase-orders/new?fromIndent=${id}`
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
                    `/users/dashboard/resources/transfers/new?fromIndent=${id}`
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
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Total Items</p>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{indent.items.length}</div>
            <p className="text-muted-foreground text-xs">Materials requested</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Converted to PO</p>
            <Hash className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {convertedCount}
            </div>
            <p className="text-muted-foreground text-xs">
              of {indent.items.length} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Expected On</p>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">
              {indent.expectedOn
                ? format(new Date(indent.expectedOn), 'dd MMM')
                : '—'}
            </div>
            <p className="text-muted-foreground text-xs">
              {indent.expectedOn
                ? format(new Date(indent.expectedOn), 'yyyy')
                : 'No date set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Created By</p>
            <User className="h-4 w-4 text-zinc-400" />
          </div>
          <CardContent>
            <div className="truncate text-xl font-bold">
              {indent.createdBy.name}
            </div>
            <p className="text-muted-foreground text-xs">
              {format(new Date(indent.createdAt), 'MMM dd, yyyy')}
            </p>
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
