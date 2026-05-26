'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Send,
  ArrowRightLeft,
  FolderOpen,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  useMaterials,
  useMaterialWithStock,
} from '@/hooks/materials/use-materials';
import { useIndent, indentsKeys } from '@/hooks/indents/use-indents';
import { useProjects } from '@/hooks/project/use-projects';
import { useStorageLocations } from '@/hooks/storage-locations/use-storage-locations';
import { useCurrentUserEmployee } from '@/hooks/employee';
import type { Indent } from '@/types/indents';
import type { Material } from '@/types/materials';
import {
  useCreateSiteTransfer,
  useSiteTransfers,
} from '@/hooks/site-transfers';
import { SiteTransferStatus } from '@/types/site-transfers';
import { generateTransferNumber } from '@/lib/utils/document-number-utils';
import { materialsKeys } from '@/hooks/materials/use-materials';

interface ItemRow {
  materialId: number;
  materialName: string;
  sentQuantity: number;
  remarks: string;
}

function StockDisplay({ materialId }: { materialId: number }) {
  const { data } = useMaterialWithStock(materialId);
  if (!data) return <span className="text-xs text-zinc-400">—</span>;
  const stock = data.currentStock ?? 0;
  return (
    <span
      className={`text-xs font-medium ${stock <= 0 ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}
    >
      {stock <= 0 && <AlertTriangle className="mr-0.5 inline h-3 w-3" />}
      {stock} {data.unit}
    </span>
  );
}

const emptyItemRow: ItemRow = {
  materialId: 0,
  materialName: '',
  sentQuantity: 1,
  remarks: '',
};

function buildItemRowsFromIndent(indent: Indent, mats: Material[]): ItemRow[] {
  if (indent.items.length === 0) return [emptyItemRow];
  return indent.items.map((item) => {
    const mat = mats.find((m) => m.id === item.material.id);
    return {
      materialId: item.material.id,
      materialName: item.material.materialName || mat?.materialName || '',
      sentQuantity: item.requestedQuantity,
      remarks: '',
    };
  });
}

export default function NewSiteTransferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIndentId = searchParams.get('fromIndent')
    ? Number(searchParams.get('fromIndent'))
    : undefined;

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: existingTransfers = [] } = useSiteTransfers();
  const { data: sourceIndent } = useIndent(fromIndentId ?? 0);
  const { mutate: createTransfer, isPending } = useCreateSiteTransfer();

  const [form, setForm] = useState({
    transferNumber: generateTransferNumber([]),
    issueDate: new Date().toISOString().slice(0, 10),
    sendingProjectId: 0,
    sendingStorageLocationId: 0,
    receivingProjectId: 0,
    receivingStorageLocationId: 0,
  });

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (!fromIndentId) return [emptyItemRow];
    const cachedIndent = queryClient.getQueryData<Indent>(
      indentsKeys.detail(fromIndentId)
    );
    const cachedMaterials =
      queryClient.getQueryData<Material[]>(materialsKeys.lists()) ?? [];
    if (!cachedIndent?.items.length) return [emptyItemRow];
    return buildItemRowsFromIndent(cachedIndent, cachedMaterials);
  });

  // Auto-generate transfer number once existing transfers load
  const [transferNumSet, setTransferNumSet] = useState(false);
  if (!transferNumSet && existingTransfers.length > 0) {
    setTransferNumSet(true);
    setForm((prev) => ({
      ...prev,
      transferNumber: generateTransferNumber(
        existingTransfers.map((t) => t.transferNumber)
      ),
    }));
  }

  // Fallback: pre-fill from indent when cache was empty (e.g. hard refresh)
  const [itemsPrefilled, setItemsPrefilled] = useState(
    !!(
      fromIndentId &&
      queryClient.getQueryData<Indent>(indentsKeys.detail(fromIndentId))?.items
        .length
    )
  );
  if (
    !itemsPrefilled &&
    sourceIndent &&
    materials.length > 0 &&
    sourceIndent.items.length > 0
  ) {
    setItemsPrefilled(true);
    setItems(buildItemRowsFromIndent(sourceIndent, materials));
  }

  function addItem() {
    setItems([...items, emptyItemRow]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      toast.error('At least one item is required.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof ItemRow,
    value: number | string
  ) {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'materialId') {
          const mat = materials.find((m) => m.id === Number(value));
          updated.materialName = mat?.materialName ?? '';
        }
        return updated;
      })
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEmployee) {
      toast.error('Unable to determine current employee.');
      return;
    }
    if (!form.transferNumber.trim()) {
      toast.error('Transfer number is required.');
      return;
    }
    if (!form.sendingProjectId) {
      toast.error('Sending project is required.');
      return;
    }
    if (!form.sendingStorageLocationId) {
      toast.error('Sending storage location is required.');
      return;
    }
    if (!form.receivingProjectId) {
      toast.error('Receiving project is required.');
      return;
    }
    if (!form.receivingStorageLocationId) {
      toast.error('Receiving storage location is required.');
      return;
    }
    if (items.some((it) => !it.materialId || it.sentQuantity <= 0)) {
      toast.error(
        'All items must have a material and quantity greater than 0.'
      );
      return;
    }

    createTransfer(
      {
        transferNumber: form.transferNumber.trim(),
        issueDate: new Date(form.issueDate).toISOString(),
        sendingPerson: currentEmployee.id,
        sendingProjectId: form.sendingProjectId,
        sendingStorageLocationId: form.sendingStorageLocationId,
        receivingProjectId: form.receivingProjectId,
        receivingStorageLocationId: form.receivingStorageLocationId,
        status: SiteTransferStatus.pending,
        items: items.map((item) => ({
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
      {/* Header */}
      <PageHeader
        title="New Site Transfer"
        description="Transfer materials between sites or projects"
      />

      {/* Pre-filled from indent banner */}
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

      {/* Stock warning */}
      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          Creating a site transfer immediately decrements material stock. If any
          item has insufficient stock, the entire transfer will be rejected.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transfer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Details
            </CardTitle>
            <CardDescription>
              Basic information about this transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transferNumber">Transfer Number</Label>
                <Input
                  id="transferNumber"
                  value={form.transferNumber}
                  readOnly
                  className="bg-zinc-50 font-mono dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">
                  Issue Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm({ ...form, issueDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sending Location</CardTitle>
            <CardDescription>
              Where the materials are being sent from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sendingProjectId">
                  Sending Project <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={
                    form.sendingProjectId ? String(form.sendingProjectId) : ''
                  }
                  onValueChange={(v) =>
                    setForm({ ...form, sendingProjectId: Number(v) })
                  }
                >
                  <SelectTrigger id="sendingProjectId">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendingStorageLocationId">
                  Sending Storage Location{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={
                    form.sendingStorageLocationId
                      ? String(form.sendingStorageLocationId)
                      : ''
                  }
                  onValueChange={(v) =>
                    setForm({ ...form, sendingStorageLocationId: Number(v) })
                  }
                >
                  <SelectTrigger id="sendingStorageLocationId">
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map((sl) => (
                      <SelectItem key={sl.id} value={String(sl.id)}>
                        {sl.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receiving Location</CardTitle>
            <CardDescription>
              Where the materials are being sent to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="receivingProjectId">
                  Receiving Project <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={
                    form.receivingProjectId
                      ? String(form.receivingProjectId)
                      : ''
                  }
                  onValueChange={(v) =>
                    setForm({ ...form, receivingProjectId: Number(v) })
                  }
                >
                  <SelectTrigger id="receivingProjectId">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivingStorageLocationId">
                  Receiving Storage Location{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={
                    form.receivingStorageLocationId
                      ? String(form.receivingStorageLocationId)
                      : ''
                  }
                  onValueChange={(v) =>
                    setForm({ ...form, receivingStorageLocationId: Number(v) })
                  }
                >
                  <SelectTrigger id="receivingStorageLocationId">
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map((sl) => (
                      <SelectItem key={sl.id} value={String(sl.id)}>
                        {sl.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Items to Transfer
            </CardTitle>
            <CardDescription>
              {sourceIndent
                ? 'Items pre-filled from indent — adjust quantities based on current stock'
                : 'Add materials to transfer. Stock is decremented immediately on creation.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 pl-6">#</TableHead>
                    <TableHead className="min-w-[200px]">
                      Material <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-32">Current Stock</TableHead>
                    <TableHead className="w-32">
                      Send Qty <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="min-w-[160px]">Remarks</TableHead>
                    <TableHead className="w-12 pr-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-6 text-sm text-zinc-500">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={
                            item.materialId > 0 ? String(item.materialId) : ''
                          }
                          onValueChange={(v) =>
                            updateItem(index, 'materialId', Number(v))
                          }
                        >
                          <SelectTrigger className="w-full">
                            {item.materialId > 0 ? (
                              <span className="truncate">
                                {item.materialName ||
                                  materials.find(
                                    (m) => m.id === item.materialId
                                  )?.materialName ||
                                  'Select material'}
                              </span>
                            ) : (
                              <SelectValue placeholder="Select material" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.materialName} ({m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {item.materialId > 0 && (
                          <StockDisplay materialId={item.materialId} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.sentQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'sentQuantity',
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.remarks}
                          onChange={(e) =>
                            updateItem(index, 'remarks', e.target.value)
                          }
                          placeholder="Optional note"
                        />
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center gap-1">
                          {index === items.length - 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                              onClick={addItem}
                              aria-label="Add item"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" type="button" asChild disabled={isPending}>
            <Link href={routes.resources.transfers.href}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending || !currentEmployee}
            className="ml-auto"
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
        </div>
      </form>
    </div>
  );
}
