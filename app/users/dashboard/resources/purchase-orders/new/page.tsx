'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  ShoppingCart,
  Send,
  Plus,
  Trash2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useVendors } from '@/hooks/vendors/use-vendors';
import { useProjects } from '@/hooks/project/use-projects';
import {
  useIndent,
  useIndents,
  indentsKeys,
} from '@/hooks/indents/use-indents';
import {
  useMaterials,
  useMaterialWithStock,
  materialsKeys,
} from '@/hooks/materials/use-materials';
import type { Indent } from '@/types/indents';
import type { Material } from '@/types/materials';
import { usePurchaseOrders } from '@/hooks/purchase-orders/use-purchase-orders';
import { useCreatePurchaseOrder } from '@/hooks/purchase-orders/use-purchase-orders-mutations';
import { useCurrentUserEmployee } from '@/hooks/employee';
import {
  PurchaseOrderStatus,
  purchaseOrderStatusLabels,
  type InlinePurchaseOrderItemInput,
} from '@/types/purchase-orders';
import { generatePoNumber } from '@/lib/utils/document-number-utils';

interface ItemRow {
  materialId: number;
  materialName: string;
  indentItemId?: number;
  orderedQuantity: number;
  unitPrice: number;
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
  orderedQuantity: 1,
  unitPrice: 0,
  remarks: '',
};

function buildItemRows(indent: Indent, mats: Material[]): ItemRow[] {
  if (indent.items.length === 0) return [emptyItemRow];
  return indent.items.map((item) => {
    const mat = mats.find((m) => m.id === item.material.id);
    return {
      materialId: item.material.id,
      materialName: item.material.materialName || mat?.materialName || '',
      indentItemId: item.id,
      orderedQuantity: item.requestedQuantity,
      unitPrice: 0,
      remarks: '',
    };
  });
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIndentId = searchParams.get('fromIndent')
    ? Number(searchParams.get('fromIndent'))
    : undefined;

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: vendors = [] } = useVendors();
  const { data: projects = [] } = useProjects();
  const { data: indents = [] } = useIndents();
  const { data: materials = [] } = useMaterials();
  const { data: existingOrders = [] } = usePurchaseOrders();
  const { data: sourceIndent } = useIndent(fromIndentId ?? 0);
  const { mutateAsync: createPO, isPending } = useCreatePurchaseOrder();

  // Read cache synchronously so navigation pre-fill works without waiting for an effect
  const [form, setForm] = useState(() => {
    const cachedIndent = fromIndentId
      ? queryClient.getQueryData<Indent>(indentsKeys.detail(fromIndentId))
      : undefined;
    return {
      poNumber: generatePoNumber(existingOrders.map((po) => po.poNumber)),
      vendorId: 0,
      projectId: cachedIndent?.projectId ?? 0,
      indentId: cachedIndent?.id ?? fromIndentId ?? 0,
      status: PurchaseOrderStatus.draft,
      expectedDeliveryDate: '',
      remarks: '',
    };
  });
  const [items, setItems] = useState<ItemRow[]>(() => {
    if (!fromIndentId) return [emptyItemRow];
    const cachedIndent = queryClient.getQueryData<Indent>(
      indentsKeys.detail(fromIndentId)
    );
    const cachedMaterials =
      queryClient.getQueryData<Material[]>(materialsKeys.lists()) ?? [];
    if (!cachedIndent?.items.length) return [emptyItemRow];
    return buildItemRows(cachedIndent, cachedMaterials);
  });
  // Only needed as fallback when cache is empty (e.g. hard refresh)
  const [prefilled, setPrefilled] = useState(
    !!(
      fromIndentId &&
      queryClient.getQueryData<Indent>(indentsKeys.detail(fromIndentId))?.items
        .length
    )
  );

  const [prevExistingOrders, setPrevExistingOrders] = useState(existingOrders);
  if (prevExistingOrders !== existingOrders && existingOrders.length > 0) {
    setPrevExistingOrders(existingOrders);
    setForm((prev) => ({
      ...prev,
      poNumber: generatePoNumber(existingOrders.map((po) => po.poNumber)),
    }));
  }

  // Pre-fill from indent — wait for both indent AND a non-empty items list to be ready
  if (
    !prefilled &&
    sourceIndent &&
    materials.length > 0 &&
    sourceIndent.items.length > 0
  ) {
    setPrefilled(true);
    setForm((prev) => ({
      ...prev,
      indentId: sourceIndent.id,
      projectId: prev.projectId || sourceIndent.projectId || 0,
    }));
    setItems(
      sourceIndent.items.map((item) => {
        const mat = materials.find((m) => m.id === item.material.id);
        return {
          materialId: item.material.id,
          materialName: item.material.materialName || mat?.materialName || '',
          indentItemId: item.id,
          orderedQuantity: item.requestedQuantity,
          unitPrice: 0,
          remarks: '',
        };
      })
    );
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.orderedQuantity * item.unitPrice,
    0
  );

  function addItem() {
    setItems([
      ...items,
      {
        materialId: 0,
        materialName: '',
        orderedQuantity: 1,
        unitPrice: 0,
        remarks: '',
      },
    ]);
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
    value: string | number
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.poNumber.trim()) {
      toast.error('PO number is required.');
      return;
    }
    if (!form.vendorId) {
      toast.error('Vendor is required.');
      return;
    }
    if (!form.projectId) {
      toast.error('Project is required.');
      return;
    }
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current user.');
      return;
    }
    if (items.some((it) => !it.materialId || it.orderedQuantity <= 0)) {
      toast.error('All items must have a material and quantity.');
      return;
    }

    try {
      const po = await createPO({
        poNumber: form.poNumber.trim(),
        vendorId: form.vendorId,
        projectId: form.projectId,
        indentId: form.indentId || undefined,
        status: form.status,
        createdBy: currentEmployee.id,
        expectedDeliveryDate: form.expectedDeliveryDate
          ? new Date(form.expectedDeliveryDate).toISOString()
          : undefined,
        remarks: form.remarks.trim() || undefined,
        totalAmount: totalAmount || undefined,
        items: items.map(
          (item): InlinePurchaseOrderItemInput => ({
            materialId: item.materialId,
            indentItemId: item.indentItemId,
            orderedQuantity: item.orderedQuantity,
            unitPrice: item.unitPrice || undefined,
            totalPrice: item.unitPrice
              ? item.orderedQuantity * item.unitPrice
              : undefined,
            remarks: item.remarks.trim() || undefined,
          })
        ),
      });

      router.push(`/users/dashboard/resources/purchase-orders/${po.id}`);
    } catch {
      // errors handled by mutation hook
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Create Purchase Order
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Create a new vendor purchase order
        </p>
      </div>

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
            — review quantities against current stock before creating.
          </span>
          <Link
            href={`/users/dashboard/resources/indents/${sourceIndent.id}`}
            className="ml-auto flex-shrink-0 font-medium underline-offset-2 hover:underline"
          >
            View indent
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PO Details
            </CardTitle>
            <CardDescription>
              Basic information about this purchase order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="poNumber">
                  PO Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="poNumber"
                  value={form.poNumber}
                  onChange={(e) =>
                    setForm({ ...form, poNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorId">
                  Vendor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.vendorId ? String(form.vendorId) : ''}
                  onValueChange={(v) =>
                    setForm({ ...form, vendorId: Number(v) })
                  }
                >
                  <SelectTrigger id="vendorId">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">
                  Project <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.projectId ? String(form.projectId) : ''}
                  onValueChange={(v) =>
                    setForm({ ...form, projectId: Number(v) })
                  }
                >
                  <SelectTrigger id="projectId">
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as PurchaseOrderStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PurchaseOrderStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {purchaseOrderStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indentId">
                  Linked Indent{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={form.indentId ? String(form.indentId) : 'none'}
                  onValueChange={(v) =>
                    setForm({ ...form, indentId: v === 'none' ? 0 : Number(v) })
                  }
                >
                  <SelectTrigger id="indentId">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {indents.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.indentNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">
                  Expected Delivery{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={form.expectedDeliveryDate}
                  onChange={(e) =>
                    setForm({ ...form, expectedDeliveryDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">
                  Remarks{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional notes for this purchase order..."
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ordered Items
            </CardTitle>
            <CardDescription>
              {sourceIndent
                ? 'Items pre-filled from indent — adjust quantities based on current stock'
                : 'Add the materials for this purchase order'}
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
                      Quantity <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-40">Unit Price (₹)</TableHead>
                    <TableHead className="w-40">Line Total</TableHead>
                    <TableHead className="min-w-[140px]">Remarks</TableHead>
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
                          value={item.orderedQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'orderedQuantity',
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'unitPrice',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.unitPrice
                          ? `₹${(item.orderedQuantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : '—'}
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
            {totalAmount > 0 && (
              <div className="flex justify-end border-t px-6 py-4 text-sm font-semibold">
                Total: ₹
                {totalAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" type="button" asChild disabled={isPending}>
            <Link href="/users/dashboard/resources/purchase-orders">
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={isPending} className="ml-auto">
            <Send className="mr-2 h-4 w-4" />
            {isPending ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
