'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { AlertTriangle, FolderOpen, Loader2, Send } from 'lucide-react';
import { useIndent, indentsKeys } from '@/hooks/indents/use-indents';
import { materialsKeys } from '@/hooks/materials/use-materials';
import type { Indent } from '@/types/indents';
import type { Material } from '@/types/materials';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { toast } from '@/lib/styles/toast-styles';
import { useCreateSiteTransfer } from '@/hooks/site-transfers';
import { SiteTransferStatus } from '@/types/site-transfers';
import {
  SiteTransferForm,
  SITE_TRANSFER_FORM_ID,
  type SiteTransferItemRow,
  type SiteTransferSubmitData,
} from '@/features/site-transfers/components';

export default function NewSiteTransferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIndentId = searchParams.get('fromIndent')
    ? Number(searchParams.get('fromIndent'))
    : undefined;

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: sourceIndent } = useIndent(fromIndentId ?? 0);
  const { mutate: createTransfer, isPending } = useCreateSiteTransfer();

  // Read cache synchronously so navigation pre-fill works without waiting for an effect
  const cachedIndent = fromIndentId
    ? queryClient.getQueryData<Indent>(indentsKeys.detail(fromIndentId))
    : undefined;
  const cachedMaterials =
    queryClient.getQueryData<Material[]>(materialsKeys.lists()) ?? [];

  // Wait for indent to load when navigating from an indent page with no cache
  if (fromIndentId && !sourceIndent && !cachedIndent) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const resolvedIndent = sourceIndent ?? cachedIndent;

  const initialItems: SiteTransferItemRow[] | undefined = resolvedIndent?.items
    .length
    ? resolvedIndent.items.map((item) => {
        const mat = cachedMaterials.find((m) => m.id === item.material.id);
        return {
          materialId: item.material.id,
          materialName: item.material.materialName || mat?.materialName || '',
          sentQuantity: item.requestedQuantity,
          remarks: '',
        };
      })
    : undefined;

  function handleSubmit(data: SiteTransferSubmitData) {
    if (!currentEmployee) {
      toast.error('Unable to determine current user.');
      return;
    }
    createTransfer(
      {
        transferNumber: data.form.transferNumber.trim(),
        issueDate: new Date(data.form.issueDate).toISOString(),
        sendingPerson: currentEmployee.id,
        sendingProjectId: data.form.sendingProjectId,
        sendingStorageLocationId: data.form.sendingStorageLocationId,
        receivingProjectId: data.form.receivingProjectId,
        receivingStorageLocationId: data.form.receivingStorageLocationId,
        status: SiteTransferStatus.pending,
        items: data.items.map((item) => ({
          materialId: item.materialId,
          sentQuantity: item.sentQuantity,
          remarks: item.remarks.trim() || undefined,
        })),
      },
      {
        onSuccess: (transfer) => {
          router.push(routes.resources.transfers.detail(transfer.id).href);
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="New Site Transfer"
        description="Transfer materials between sites or projects"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.transfers.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={SITE_TRANSFER_FORM_ID}
              disabled={isPending || !currentEmployee}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Transfer
                </>
              )}
            </Button>
          </>
        }
      />

      {sourceIndent && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
          <span>
            Pre-filled from indent{' '}
            <Badge
              variant="outline"
              className="mx-1 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300"
            >
              {sourceIndent.indentNumber}
            </Badge>
            — verify quantities against current stock before submitting.
          </span>
          <Link
            href={routes.resources.indents.detail(sourceIndent.id).href}
            className="ml-auto flex-shrink-0 font-medium underline-offset-2 hover:underline"
          >
            View indent
          </Link>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          Creating a site transfer immediately decrements material stock. If any
          item has insufficient stock, the entire transfer will be rejected.
        </span>
      </div>

      <SiteTransferForm initialItems={initialItems} onSubmit={handleSubmit} />
    </div>
  );
}
