'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
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
import { Receipt, Package, Plus, Trash2 } from 'lucide-react';
import { useVendors } from '@/hooks/vendors/use-vendors';
import { usePurchaseOrders } from '@/hooks/purchase-orders/use-purchase-orders';
import { useMaterials } from '@/hooks/materials/use-materials';
import { useStorageLocations } from '@/hooks/storage-locations/use-storage-locations';
import { useProjects } from '@/hooks/project/use-projects';
import { useGRNs } from '@/hooks/grn';
import { generateGrnNumber } from '@/lib/utils/document-number-utils';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GRNItemRow {
  materialId: number;
  materialName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
}

export interface GoodsReceiptFormState {
  grnNumber: string;
  receivedOn: string;
  vendorId: number;
  purchaseOrderId: number;
  projectId: number;
  storageLocationId: number;
  deliveryChallanNumber: string;
  invoiceNumber: string;
  invoiceAmount: string;
  remarks: string;
}

export interface GoodsReceiptSubmitData {
  form: GoodsReceiptFormState;
  items: GRNItemRow[];
  totalCost: number;
}

interface GoodsReceiptFormProps {
  initialValues?: Partial<GoodsReceiptFormState>;
  initialItems?: GRNItemRow[];
  onSubmit: (data: GoodsReceiptSubmitData) => void;
}

export const GOODS_RECEIPT_FORM_ID = 'goods-receipt-form';

const EMPTY_ITEM: GRNItemRow = {
  materialId: 0,
  materialName: '',
  orderedQuantity: 1,
  receivedQuantity: 1,
  unitCost: 0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoodsReceiptForm({
  initialValues,
  initialItems,
  onSubmit,
}: GoodsReceiptFormProps) {
  const { data: vendors = [] } = useVendors();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: existingGRNs = [] } = useGRNs();

  const grnNumber = useMemo(
    () =>
      initialValues?.grnNumber ??
      generateGrnNumber(existingGRNs.map((g) => g.grnNumber)),
    [existingGRNs, initialValues]
  );

  const [form, setForm] = useState<GoodsReceiptFormState>(() => ({
    grnNumber: '',
    receivedOn:
      initialValues?.receivedOn ?? new Date().toISOString().slice(0, 10),
    vendorId: initialValues?.vendorId ?? 0,
    purchaseOrderId: initialValues?.purchaseOrderId ?? 0,
    projectId: initialValues?.projectId ?? 0,
    storageLocationId: initialValues?.storageLocationId ?? 0,
    deliveryChallanNumber: initialValues?.deliveryChallanNumber ?? '',
    invoiceNumber: initialValues?.invoiceNumber ?? '',
    invoiceAmount: initialValues?.invoiceAmount ?? '',
    remarks: initialValues?.remarks ?? '',
  }));

  const [items, setItems] = useState<GRNItemRow[]>(
    initialItems ?? [EMPTY_ITEM]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  const totalCost = items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitCost,
    0
  );

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function setField<K extends keyof GoodsReceiptFormState>(
    field: K,
    value: GoodsReceiptFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  function clearRowError(index: number, field: string) {
    setRowErrors((prev) => {
      const row = prev[index];
      if (!row?.[field]) return prev;
      const next = { ...row };
      delete next[field];
      return { ...prev, [index]: next };
    });
  }

  // ---------------------------------------------------------------------------
  // Item management
  // ---------------------------------------------------------------------------

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      toast.error('At least one item is required.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setRowErrors((prev) => {
      const next: Record<number, Record<string, string>> = {};
      for (const [k, v] of Object.entries(prev)) {
        const key = Number(k);
        if (key < index) next[key] = v;
        else if (key > index) next[key - 1] = v;
      }
      return next;
    });
  }

  function updateItem(
    index: number,
    field: keyof GRNItemRow,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'materialId') {
          const mat = materials.find((m) => m.id === Number(value));
          updated.materialName = mat?.materialName ?? '';
        }
        return updated;
      })
    );
    clearRowError(index, String(field));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    const newRowErrors: Record<number, Record<string, string>> = {};

    const receivedOnError = required('Received date')(form.receivedOn);
    if (receivedOnError) newErrors.receivedOn = receivedOnError;

    if (!form.vendorId) newErrors.vendorId = 'Vendor is required';

    for (const [i, item] of items.entries()) {
      const rowErr: Record<string, string> = {};
      if (!item.materialId) rowErr.materialId = 'Select a material';
      if (item.orderedQuantity <= 0) rowErr.orderedQuantity = 'Must be > 0';
      if (item.receivedQuantity < 0)
        rowErr.receivedQuantity = 'Cannot be negative';
      if (Object.keys(rowErr).length > 0) newRowErrors[i] = rowErr;
    }

    setErrors(newErrors);
    setRowErrors(newRowErrors);

    return (
      Object.keys(newErrors).length === 0 &&
      Object.keys(newRowErrors).length === 0
    );
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form',
      });
      return;
    }
    onSubmit({ form: { ...form, grnNumber }, items, totalCost });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      id={GOODS_RECEIPT_FORM_ID}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
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
                value={grnNumber}
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
                onChange={(e) => setField('receivedOn', e.target.value)}
                className={errors.receivedOn ? 'border-red-500' : ''}
              />
              {errors.receivedOn && (
                <p className="text-sm text-red-500">{errors.receivedOn}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorId">
                Vendor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.vendorId ? String(form.vendorId) : ''}
                onValueChange={(v) => setField('vendorId', Number(v))}
              >
                <SelectTrigger
                  id="vendorId"
                  className={errors.vendorId ? 'border-red-500' : ''}
                >
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
              {errors.vendorId && (
                <p className="text-sm text-red-500">{errors.vendorId}</p>
              )}
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
                  setField('purchaseOrderId', v === 'none' ? 0 : Number(v))
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
                  setField('projectId', v === 'none' ? 0 : Number(v))
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
                  setField('storageLocationId', v === 'none' ? 0 : Number(v))
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
                  setField('deliveryChallanNumber', e.target.value)
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
                onChange={(e) => setField('invoiceNumber', e.target.value)}
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
                onChange={(e) => setField('invoiceAmount', e.target.value)}
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
                onChange={(e) => setField('remarks', e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Received Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Received Items
          </CardTitle>
          <CardDescription>
            Add the materials that were received
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
                {items.map((item, index) => {
                  const rErr = rowErrors[index] ?? {};
                  return (
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
                          <SelectTrigger
                            className={`w-full ${rErr.materialId ? 'border-red-500' : ''}`}
                          >
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
                        {rErr.materialId && (
                          <p className="mt-1 text-xs text-red-500">
                            {rErr.materialId}
                          </p>
                        )}
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
                          className={`w-full ${rErr.orderedQuantity ? 'border-red-500' : ''}`}
                        />
                        {rErr.orderedQuantity && (
                          <p className="mt-1 text-xs text-red-500">
                            {rErr.orderedQuantity}
                          </p>
                        )}
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
                          className={`w-full ${rErr.receivedQuantity ? 'border-red-500' : ''}`}
                        />
                        {rErr.receivedQuantity && (
                          <p className="mt-1 text-xs text-red-500">
                            {rErr.receivedQuantity}
                          </p>
                        )}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalCost > 0 && (
            <div className="flex justify-end border-t px-6 py-4 text-sm font-semibold">
              Total: ₹
              {totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
