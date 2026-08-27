'use client';

import { useState, useMemo, useCallback } from 'react';
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
import {
  FileText,
  ShoppingCart,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useVendors } from '@tornotron/echno-core/vendor/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useIndents } from '@tornotron/echno-core/indents/hooks';
import {
  useMaterialWithStock,
  useMaterials,
} from '@tornotron/echno-core/materials/hooks';
import { usePurchaseOrders } from '@tornotron/echno-core/purchase-orders/hooks';
import {
  PurchaseOrderStatus,
  purchaseOrderStatusLabels,
} from '@tornotron/echno-core/purchase-orders/types';
import { generatePoNumber } from '@/lib/utils/document-number-utils';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface POItemRow {
  materialId: number;
  materialName: string;
  indentItemId?: number;
  orderedQuantity: number;
  unitPrice: number;
  remarks: string;
}

export interface PurchaseOrderFormState {
  poNumber: string;
  vendorId: number;
  projectId: number;
  indentId: number;
  status: PurchaseOrderStatus;
  expectedDeliveryDate: string;
  remarks: string;
}

export interface PurchaseOrderSubmitData {
  form: PurchaseOrderFormState;
  items: POItemRow[];
  totalAmount: number;
}

interface PurchaseOrderFormProps {
  initialValues?: Partial<PurchaseOrderFormState>;
  initialItems?: POItemRow[];
  onSubmit: (data: PurchaseOrderSubmitData) => void;
}

/**
 * DOM id shared by the purchase-order form and any submit button rendered
 * outside it (for example in a page header), wired through the button's `form`
 * attribute so it can submit the form.
 */
import { useFormDraft, useFormDraftScope } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { FormDraftBanner } from '@/components/common';
export const PURCHASE_ORDER_FORM_ID = 'purchase-order-form';

const EMPTY_ITEM: POItemRow = {
  materialId: 0,
  materialName: '',
  orderedQuantity: 1,
  unitPrice: 0,
  remarks: '',
};

// ---------------------------------------------------------------------------
// Stock display sub-component
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Purchase-order create/edit form: header fields (vendor, project, linked
 * indent) plus an editable table of material line items, each showing live
 * stock for the chosen material. Submitting hands the assembled header and
 * item rows to `onSubmit`; it does not call the API itself.
 *
 * @param props.initialValues - Header values to prefill when editing.
 * @param props.initialItems - Line item rows to prefill when editing.
 * @param props.onSubmit - Receives the collected form state and item rows.
 */
export function PurchaseOrderForm({
  initialValues,
  initialItems,
  onSubmit,
}: PurchaseOrderFormProps) {
  const { data: vendors = [] } = useVendors();
  const { data: projects = [] } = useProjects();
  const { data: indents = [] } = useIndents();
  const { data: materials = [] } = useMaterials();
  const { data: existingOrders = [] } = usePurchaseOrders();

  const [form, setForm] = useState<PurchaseOrderFormState>(() => ({
    poNumber:
      initialValues?.poNumber ??
      generatePoNumber(existingOrders.map((po) => po.poNumber)),
    vendorId: initialValues?.vendorId ?? 0,
    projectId: initialValues?.projectId ?? 0,
    indentId: initialValues?.indentId ?? 0,
    status: initialValues?.status ?? PurchaseOrderStatus.draft,
    expectedDeliveryDate: initialValues?.expectedDeliveryDate ?? '',
    remarks: initialValues?.remarks ?? '',
  }));

  const [items, setItems] = useState<POItemRow[]>(initialItems ?? [EMPTY_ITEM]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Update PO number once existing orders load (only if still at default)
  const [ordersSeeded, setOrdersSeeded] = useState(false);
  if (!ordersSeeded && existingOrders.length > 0) {
    setOrdersSeeded(true);
    setForm((prev) => ({
      ...prev,
      poNumber:
        prev.poNumber ||
        generatePoNumber(existingOrders.map((po) => po.poNumber)),
    }));
  }

  // A purchase order is a header plus priced line items, which is as much
  // typing as anything in the app. The PO number is left out of the draft: it
  // is generated from the orders that already exist, and restoring yesterday's
  // number over today's would put a duplicate in front of a vendor.
  const draftScope = useFormDraftScope();
  const draftValues = useMemo(
    () => ({ fields: { ...form, poNumber: '' }, items }),
    [form, items]
  );
  const applyDraft = useCallback(
    (values: { fields: PurchaseOrderFormState; items: POItemRow[] }) => {
      setForm((prev) => ({ ...values.fields, poNumber: prev.poNumber }));
      setItems(values.items);
    },
    []
  );
  const { draft, restoreDraft, discardDraft } = useFormDraft<{
    fields: PurchaseOrderFormState;
    items: POItemRow[];
  }>({
    formId: FORM_DRAFT_IDS.PURCHASE_ORDER,
    scope: draftScope,
    values: draftValues,
    onRestore: applyDraft,
  });

  const totalAmount = items.reduce(
    (sum, item) => sum + item.orderedQuantity * item.unitPrice,
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

  function setField<K extends keyof PurchaseOrderFormState>(
    field: K,
    value: PurchaseOrderFormState[K]
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
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function updateItem(
    index: number,
    field: keyof POItemRow,
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

    const poError = required('PO number')(form.poNumber);
    if (poError) newErrors.poNumber = poError;

    if (!form.vendorId) newErrors.vendorId = 'Vendor is required';
    if (!form.projectId) newErrors.projectId = 'Project is required';

    for (const [i, item] of items.entries()) {
      const rowErr: Record<string, string> = {};
      if (!item.materialId) rowErr.materialId = 'Select a material';
      if (item.orderedQuantity <= 0) rowErr.orderedQuantity = 'Must be > 0';
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
    onSubmit({ form, items, totalAmount });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      id={PURCHASE_ORDER_FORM_ID}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <FormDraftBanner
        draft={draft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
        label="purchase order"
      />
      {/* PO Details */}
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
                onChange={(e) => setField('poNumber', e.target.value)}
                className={errors.poNumber ? 'border-red-500' : ''}
              />
              {errors.poNumber && (
                <p className="text-sm text-red-500">{errors.poNumber}</p>
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
              <Label htmlFor="projectId">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.projectId ? String(form.projectId) : ''}
                onValueChange={(v) => setField('projectId', Number(v))}
              >
                <SelectTrigger
                  id="projectId"
                  className={errors.projectId ? 'border-red-500' : ''}
                >
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
              {errors.projectId && (
                <p className="text-sm text-red-500">{errors.projectId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setField('status', v as PurchaseOrderStatus)
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
                  setField('indentId', v === 'none' ? 0 : Number(v))
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
                  setField('expectedDeliveryDate', e.target.value)
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
                onChange={(e) => setField('remarks', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ordered Items
          </CardTitle>
          <CardDescription>
            Add the materials for this purchase order
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
                    Qty <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-40">Unit Price (₹)</TableHead>
                  <TableHead className="w-36">Line Total</TableHead>
                  <TableHead className="min-w-[140px]">Remarks</TableHead>
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
                  );
                })}
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
    </form>
  );
}
