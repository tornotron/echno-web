'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { AlertTriangle, FolderOpen, Loader2, Send } from 'lucide-react';
import { useIndent, indentsKeys } from '@tornotron/echno-core/indents/hooks';
import { materialsKeys } from '@tornotron/echno-core/materials/hooks/keys';
import type { Indent } from '@tornotron/echno-core/indents/types';
import type { Material } from '@tornotron/echno-core/materials/types';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useCreateSiteTransfer } from '@tornotron/echno-core/site-transfers/hooks';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { ApiError } from '@/lib/api/api-client';
import {
  SiteTransferLineType,
  SiteTransferStatus,
  type CreateSiteTransferItemRequest,
} from '@tornotron/echno-core/site-transfers/types';
import {
  SiteTransferForm,
  SITE_TRANSFER_FORM_ID,
  type SiteTransferAssetRow,
  type SiteTransferItemRow,
  type SiteTransferSubmitData,
} from '@/features/site-transfers/components';
import { assetKeys, useAsset } from '@/hooks/assets';

export default function NewSiteTransferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIndentId = searchParams.get('fromIndent')
    ? Number(searchParams.get('fromIndent'))
    : undefined;

  // `?assetId=` raises the transfer from an asset's page: the asset goes on as
  // a line, and the sending side is where the asset register says it is.
  const parsedAssetId = Number.parseInt(searchParams.get('assetId') ?? '', 10);
  const fromAssetId =
    Number.isFinite(parsedAssetId) && parsedAssetId > 0
      ? parsedAssetId
      : undefined;
  const assetParamGiven = searchParams.has('assetId');
  const { data: sourceAsset, isLoading: assetLoading } = useAsset(
    fromAssetId ?? 0
  );

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: sourceIndent } = useIndent(fromIndentId ?? 0);
  const { mutate: createTransfer, isPending } = useCreateSiteTransfer();
  const clearFormDraft = useClearFormDraft();

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

  if (fromAssetId && assetLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const resolvedIndent = sourceIndent ?? cachedIndent;

  const assetPrefill =
    sourceAsset &&
    sourceAsset.assignedProjectId &&
    sourceAsset.locationId &&
    !sourceAsset.inTransitSiteTransferId
      ? {
          sending: {
            projectId: sourceAsset.assignedProjectId,
            storageLocationId: sourceAsset.locationId,
          },
          assets: [
            {
              assetId: sourceAsset.id,
              assetCode: sourceAsset.assetId || null,
              name: sourceAsset.name,
              remarks: '',
            } satisfies SiteTransferAssetRow,
          ],
        }
      : undefined;

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
        issueDate: new Date(data.form.issueDate).toISOString(),
        sendingPerson: currentEmployee.id,
        sendingProjectId: data.form.sendingProjectId,
        sendingStorageLocationId: data.form.sendingStorageLocationId,
        receivingProjectId: data.form.receivingProjectId,
        receivingStorageLocationId: data.form.receivingStorageLocationId,
        status: SiteTransferStatus.pending,
        items: [
          ...data.items.map(
            (item): CreateSiteTransferItemRequest => ({
              materialId: item.materialId,
              sentQuantity: item.sentQuantity,
              remarks: item.remarks.trim() || undefined,
            })
          ),
          ...data.assets.map(
            (asset): CreateSiteTransferItemRequest => ({
              lineType: SiteTransferLineType.asset,
              assetId: asset.assetId,
              remarks: asset.remarks.trim() || undefined,
            })
          ),
        ],
      },
      {
        onSuccess: (transfer) => {
          // The record exists now, so the local draft describes work already done.
          // Left behind it would be offered on the next visit to this form.
          clearFormDraft(FORM_DRAFT_IDS.SITE_TRANSFER);
          // An asset line puts its asset in transit or moves it at once.
          if (data.assets.length > 0) {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
          }

          toast.success('Transfer Created', {
            description:
              'Site transfer created successfully. Stock has been updated.',
          });
          router.push(routes.resources.transfers.detail(transfer.id).href);
        },
        onError: (err) => {
          const message = getErrorMessage(err);
          const isInsufficientStock =
            err instanceof ApiError &&
            err.status === 400 &&
            message.toLowerCase().includes('insufficient stock');
          if (isInsufficientStock) {
            toast.error('Insufficient Stock', { description: message });
          } else {
            toast.error(getErrorTitle(err, 'Failed to Create Transfer'), {
              description: message,
            });
          }
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="New Site Transfer"
        description="Transfer materials and assets between sites or projects"
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

      {assetParamGiven && !sourceAsset && (
        <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            The asset in the link could not be loaded, so it has not been added.
            Add it from the Assets to Transfer section below.
          </span>
        </div>
      )}

      {fromAssetId && sourceAsset && !assetPrefill && (
        <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {sourceAsset.inTransitSiteTransferId
              ? `${sourceAsset.name} is already in transit on ${sourceAsset.inTransitSiteTransferNumber ?? 'another transfer'}, so it cannot be added here.`
              : `${sourceAsset.name} has no project and storage location recorded, so a transfer cannot say where it is sent from. Set them on the asset first.`}
          </span>
        </div>
      )}

      <SiteTransferForm
        initialItems={initialItems}
        initialAssets={assetPrefill?.assets}
        initialSending={assetPrefill?.sending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
