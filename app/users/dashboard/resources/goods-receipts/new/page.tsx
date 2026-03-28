'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
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
  Receipt,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useVendors } from '@/hooks/vendors/use-vendors';
import {
  usePurchaseOrders,
  usePurchaseOrder,
  poKeys,
} from '@/hooks/purchase-orders/use-purchase-orders';
import { useMaterials } from '@/hooks/materials/use-materials';
import { useStorageLocations } from '@/hooks/storage-locations/use-storage-locations';
import { useProjects } from '@/hooks/project/use-projects';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { useGRNs, useCreateGRN } from '@/hooks/grn';
import type { PurchaseOrder } from '@/types/purchase-orders';
import { generateGrnNumber } from '@/lib/utils/document-number-utils';

interface ItemRow {
  materialId: number;
  materialName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
}

const emptyItemRow: ItemRow = {
  materialId: 0,
  materialName: '',
  orderedQuantity: 1,
  receivedQuantity: 1,
  unitCost: 0,
};

function buildItemRowsFromPO(po: PurchaseOrder): ItemRow[] {
  if (po.items.length === 0) return [emptyItemRow];
  return po.items.map((item) => ({
    materialId: item.materialId,
    materialName: item.materialName,
    orderedQuantity: item.orderedQuantity,
    receivedQuantity: item.orderedQuantity,
    unitCost: item.unitPrice ?? 0,
  }));
}

export default function NewGRNPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromPOId = Number(searchParams.get('fromPO')) || 0;

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: vendors = [] } = useVendors();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: existingGRNs = [] } = useGRNs();
  const { data: sourcePO } = usePurchaseOrder(fromPOId);
  const { mutate: createGRN, isPending } = useCreateGRN();

  // Read cache synchronously so navigation pre-fill works without waiting for an effect
  const [form, setForm] = useState(() => {
    const cached = fromPOId
      ? queryClient.getQueryData<PurchaseOrder>(poKeys.detail(fromPOId))
      : undefined;
    return {
      grnNumber: generateGrnNumber([]),
      receivedOn: new Date().toISOString().slice(0, 10),
      vendorId: cached?.vendorId ?? 0,
      purchaseOrderId: fromPOId,
      projectId: cached?.projectId ?? 0,
      storageLocationId: 0,
      deliveryChallanNumber: '',
      invoiceNumber: '',
      invoiceAmount: '',
      remarks: '',
    };
  });

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (!fromPOId) return [emptyItemRow];
    const cached = queryClient.getQueryData<PurchaseOrder>(
      poKeys.detail(fromPOId)
    );
    if (!cached?.items.length) return [emptyItemRow];
    return buildItemRowsFromPO(cached);
  });

  const [prevExistingGRNs, setPrevExistingGRNs] = useState(existingGRNs);
  if (prevExistingGRNs !== existingGRNs && existingGRNs.length > 0) {
    setPrevExistingGRNs(existingGRNs);
    setForm((prev) => ({
      ...prev,
      grnNumber: generateGrnNumber(existingGRNs.map((g) => g.grnNumber)),
    }));
  }

  // Fallback: when cache was empty on mount (e.g. hard refresh), apply once sourcePO loads
  const [prefilled, setPrefilled] = useState(
    !!(
      fromPOId &&
      queryClient.getQueryData<PurchaseOrder>(poKeys.detail(fromPOId))?.items
        .length
    )
  );

  if (!prefilled && sourcePO) {
    setPrefilled(true);
    setForm((prev) => ({
      ...prev,
      vendorId: sourcePO.vendorId,
      purchaseOrderId: sourcePO.id,
      projectId: prev.projectId || sourcePO.projectId || 0,
    }));
    setItems(buildItemRowsFromPO(sourcePO));
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

  const totalCost = items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitCost,
    0
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendorId) {
      toast.error('Vendor is required.');
      return;
    }
    if (!currentEmployee) {
      toast.error('Unable to determine current employee.');
      return;
    }
    if (
      items.some(
        (it) =>
          !it.materialId || it.orderedQuantity <= 0 || it.receivedQuantity < 0
      )
    ) {
      toast.error(
        'All items must have a material, ordered qty and received qty.'
      );
      return;
    }

    createGRN(
      {
        grnNumber: form.grnNumber.trim(),
        receivedOn: new Date(form.receivedOn).toISOString(),
        receivedByEmployeeId: currentEmployee.id!,
        vendorId: form.vendorId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        projectId: form.projectId || undefined,
        storageLocationId: form.storageLocationId || undefined,
        deliveryChallanNumber: form.deliveryChallanNumber.trim() || undefined,
        invoiceNumber: form.invoiceNumber.trim() || undefined,
        invoiceAmount: form.invoiceAmount
          ? Number.parseFloat(form.invoiceAmount)
          : undefined,
        items: items.map((item) => ({
          materialId: item.materialId,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          unitCost: item.unitCost || undefined,
        })),
      },
      {
        onSuccess: (grn) => {
          router.push(`/users/dashboard/resources/goods-receipts/${grn.id}`);
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Record GRN
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Record a goods received note
        </p>
      </div>

      {/* Pre-filled from PO banner */}
      {sourcePO && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <ShoppingCart className="h-4 w-4 flex-shrink-0" />
          <span>
            Pre-filled from purchase order{' '}
            <Badge
              variant="outline"
              className="mx-1 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300"
            >
              {sourcePO.poNumber}
            </Badge>
            — adjust received quantities to match what was actually delivered.
          </span>
          <Link
            href={`/users/dashboard/resources/purchase-orders/${sourcePO.id}`}
            className="ml-auto flex-shrink-0 font-medium underline-offset-2 hover:underline"
          >
            View PO
          </Link>
        </div>
      )}

      {/* Immutability notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          GRN creation automatically updates material stock. This cannot be
          undone — verify quantities carefully before submitting.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GRN Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              GRN Details
            </CardTitle>
            <CardDescription>
              Receipt information and reference numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="grnNumber">GRN Number</Label>
                <Input
                  id="grnNumber"
                  value={form.grnNumber}
                  readOnly
                  className="bg-zinc-50 font-mono dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivedOn">
                  Received On <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receivedOn"
                  type="date"
                  value={form.receivedOn}
                  onChange={(e) =>
                    setForm({ ...form, receivedOn: e.target.value })
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
                <Label htmlFor="purchaseOrderId">
                  Purchase Order{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={
                    form.purchaseOrderId ? String(form.purchaseOrderId) : 'none'
                  }
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      purchaseOrderId: v === 'none' ? 0 : Number(v),
                    })
                  }
                >
                  <SelectTrigger id="purchaseOrderId">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={String(po.id)}>
                        {po.poNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">
                  Project{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={form.projectId ? String(form.projectId) : 'none'}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      projectId: v === 'none' ? 0 : Number(v),
                    })
                  }
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageLocationId">
                  Storage Location{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={
                    form.storageLocationId
                      ? String(form.storageLocationId)
                      : 'none'
                  }
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      storageLocationId: v === 'none' ? 0 : Number(v),
                    })
                  }
                >
                  <SelectTrigger id="storageLocationId">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {storageLocations.map((sl) => (
                      <SelectItem key={sl.id} value={String(sl.id)}>
                        {sl.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryChallanNumber">
                  Delivery Challan #{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="deliveryChallanNumber"
                  value={form.deliveryChallanNumber}
                  onChange={(e) =>
                    setForm({ ...form, deliveryChallanNumber: e.target.value })
                  }
                  placeholder="e.g. DC-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">
                  Invoice #{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="invoiceNumber"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumber: e.target.value })
                  }
                  placeholder="e.g. INV-2026-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceAmount">
                  Invoice Amount (₹){' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="invoiceAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.invoiceAmount}
                  onChange={(e) =>
                    setForm({ ...form, invoiceAmount: e.target.value })
                  }
                  placeholder="0.00"
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
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Received Items
            </CardTitle>
            <CardDescription>
              {sourcePO
                ? 'Items pre-filled from PO — adjust received quantities to match actual delivery'
                : 'Add the materials that were received'}
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
                    <TableHead className="w-32">
                      Ordered Qty <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-32">
                      Received Qty <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-36">Unit Cost (₹)</TableHead>
                    <TableHead className="w-36">Line Total</TableHead>
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
                        <Input
                          type="number"
                          min="0"
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
                          step="1"
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'receivedQuantity',
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
                          value={item.unitCost || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'unitCost',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.unitCost
                          ? `₹${(item.receivedQuantity * item.unitCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : '—'}
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
            {totalCost > 0 && (
              <div className="flex justify-end border-t px-6 py-4 text-sm font-semibold">
                Total: ₹
                {totalCost.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" type="button" asChild disabled={isPending}>
            <Link href="/users/dashboard/resources/goods-receipts">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending || !currentEmployee}
            className="ml-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {isPending ? 'Recording...' : 'Record GRN'}
          </Button>
        </div>
      </form>
    </div>
  );
}
