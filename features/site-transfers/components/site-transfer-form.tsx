'use client';

import { useState } from 'react';
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
import { AlertTriangle, ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import {
  useMaterialWithStock,
  useMaterials,
} from '@tornotron/echno-core/materials/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useStorageLocations } from '@tornotron/echno-core/storage-locations/hooks';
import { useSiteTransfers } from '@tornotron/echno-core/site-transfers/hooks';
import { generateTransferNumber } from '@/lib/utils/document-number-utils';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SiteTransferItemRow {
  materialId: number;
  materialName: string;
  sentQuantity: number;
  remarks: string;
}

export interface SiteTransferFormState {
  transferNumber: string;
  issueDate: string;
  sendingProjectId: number;
  sendingStorageLocationId: number;
  receivingProjectId: number;
  receivingStorageLocationId: number;
}

export interface SiteTransferSubmitData {
  form: SiteTransferFormState;
  items: SiteTransferItemRow[];
}

interface SiteTransferFormProps {
  initialItems?: SiteTransferItemRow[];
  onSubmit: (data: SiteTransferSubmitData) => void;
}

export const SITE_TRANSFER_FORM_ID = 'site-transfer-form';

const EMPTY_ITEM: SiteTransferItemRow = {
  materialId: 0,
  materialName: '',
  sentQuantity: 1,
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

export function SiteTransferForm({
  initialItems,
  onSubmit,
}: SiteTransferFormProps) {
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: existingTransfers = [] } = useSiteTransfers();

  const [form, setForm] = useState<SiteTransferFormState>(() => ({
    transferNumber: generateTransferNumber([]),
    issueDate: new Date().toISOString().slice(0, 10),
    sendingProjectId: 0,
    sendingStorageLocationId: 0,
    receivingProjectId: 0,
    receivingStorageLocationId: 0,
  }));

  const [items, setItems] = useState<SiteTransferItemRow[]>(
    initialItems ?? [{ ...EMPTY_ITEM }]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Update transfer number once existing transfers load
  const [transfersSeeded, setTransfersSeeded] = useState(false);
  if (!transfersSeeded && existingTransfers.length > 0) {
    setTransfersSeeded(true);
    setForm((prev) => ({
      ...prev,
      transferNumber:
        prev.transferNumber ||
        generateTransferNumber(existingTransfers.map((t) => t.transferNumber)),
    }));
  }

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

  function setField<K extends keyof SiteTransferFormState>(
    field: K,
    value: SiteTransferFormState[K]
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
    field: keyof SiteTransferItemRow,
    value: number | string
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

    const numError = required('Transfer number')(form.transferNumber);
    if (numError) newErrors.transferNumber = numError;

    const dateError = required('Issue date')(form.issueDate);
    if (dateError) newErrors.issueDate = dateError;

    if (!form.sendingProjectId)
      newErrors.sendingProjectId = 'Sending project is required';
    if (!form.sendingStorageLocationId)
      newErrors.sendingStorageLocationId =
        'Sending storage location is required';
    if (!form.receivingProjectId)
      newErrors.receivingProjectId = 'Receiving project is required';
    if (!form.receivingStorageLocationId)
      newErrors.receivingStorageLocationId =
        'Receiving storage location is required';

    for (const [i, item] of items.entries()) {
      const rowErr: Record<string, string> = {};
      if (!item.materialId) rowErr.materialId = 'Select a material';
      if (item.sentQuantity <= 0) rowErr.sentQuantity = 'Must be > 0';
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
    onSubmit({ form, items });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      id={SITE_TRANSFER_FORM_ID}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
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
                onChange={(e) => setField('issueDate', e.target.value)}
                className={errors.issueDate ? 'border-red-500' : ''}
              />
              {errors.issueDate && (
                <p className="text-sm text-red-500">{errors.issueDate}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sending Location */}
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
                onValueChange={(v) => setField('sendingProjectId', Number(v))}
              >
                <SelectTrigger
                  id="sendingProjectId"
                  className={errors.sendingProjectId ? 'border-red-500' : ''}
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
              {errors.sendingProjectId && (
                <p className="text-sm text-red-500">
                  {errors.sendingProjectId}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendingStorageLocationId">
                Sending Storage Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={
                  form.sendingStorageLocationId
                    ? String(form.sendingStorageLocationId)
                    : ''
                }
                onValueChange={(v) =>
                  setField('sendingStorageLocationId', Number(v))
                }
              >
                <SelectTrigger
                  id="sendingStorageLocationId"
                  className={
                    errors.sendingStorageLocationId ? 'border-red-500' : ''
                  }
                >
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
              {errors.sendingStorageLocationId && (
                <p className="text-sm text-red-500">
                  {errors.sendingStorageLocationId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receiving Location */}
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
                  form.receivingProjectId ? String(form.receivingProjectId) : ''
                }
                onValueChange={(v) => setField('receivingProjectId', Number(v))}
              >
                <SelectTrigger
                  id="receivingProjectId"
                  className={errors.receivingProjectId ? 'border-red-500' : ''}
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
              {errors.receivingProjectId && (
                <p className="text-sm text-red-500">
                  {errors.receivingProjectId}
                </p>
              )}
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
                  setField('receivingStorageLocationId', Number(v))
                }
              >
                <SelectTrigger
                  id="receivingStorageLocationId"
                  className={
                    errors.receivingStorageLocationId ? 'border-red-500' : ''
                  }
                >
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
              {errors.receivingStorageLocationId && (
                <p className="text-sm text-red-500">
                  {errors.receivingStorageLocationId}
                </p>
              )}
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
            Add materials to transfer. Stock is decremented immediately on
            creation.
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
                          value={item.sentQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'sentQuantity',
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className={`w-full ${rErr.sentQuantity ? 'border-red-500' : ''}`}
                        />
                        {rErr.sentQuantity && (
                          <p className="mt-1 text-xs text-red-500">
                            {rErr.sentQuantity}
                          </p>
                        )}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
