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
import { useMaterials } from '@tornotron/echno-core/materials/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useStorageLocations } from '@tornotron/echno-core/storage-locations/hooks';
import { useSiteTransfers } from '@tornotron/echno-core/site-transfers/hooks';
import { useMaterialStocks } from '@/hooks/materials';
import { storageLocationsForProject } from '@/lib/inventory/storage-location-scope';
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

/**
 * DOM id shared by the site-transfer form and any submit button rendered
 * outside it (for example in a page header), wired through the button's `form`
 * attribute so it can submit the form.
 */
import { useFormDraft, useFormDraftScope } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { FormDraftBanner } from '@/components/common';
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

/**
 * The balance the transfer will be debited from, not the organisation total.
 * The sending project and location decide it, so the parent fetches it once
 * for every row and passes it down; that keeps the label and `validateForm`
 * reading the same figure.
 *
 * @param props.stock - Stock at the sending project and location, undefined
 *   while the read is in flight.
 * @param props.unit - Unit to label the figure with.
 * @param props.scoped - Whether a sending project has been chosen at all.
 */
function StockDisplay({
  stock,
  unit,
  scoped,
}: {
  stock: number | undefined;
  unit: string;
  scoped: boolean;
}) {
  if (!scoped) {
    return (
      <span className="text-xs text-zinc-400">Select a sending location</span>
    );
  }
  if (stock === undefined) return <span className="text-xs text-zinc-400">—</span>;
  return (
    <span
      className={`text-xs font-medium ${stock <= 0 ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}
    >
      {stock <= 0 && <AlertTriangle className="mr-0.5 inline h-3 w-3" />}
      {stock} {unit}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Site-transfer creation form: sending and receiving project/storage-location
 * fields plus an editable table of material rows, each showing the sending
 * location's live stock so shortages are visible before submit. Submitting
 * hands the assembled form state and item rows to `onSubmit`; it does not call
 * the API itself.
 *
 * @param props.initialItems - Line item rows to prefill.
 * @param props.onSubmit - Receives the collected form state and item rows.
 */
export function SiteTransferForm({
  initialItems,
  onSubmit,
}: SiteTransferFormProps) {
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: existingTransfers = [] } = useSiteTransfers();

  // Derived from the transfers the server already has, so it follows the list
  // as it loads and as it is refetched. Recomputing is cheap and the list is
  // the only input, which is why this is not held in form state and seeded
  // once: a value seeded before the query resolved would stay at the first
  // number of the year forever.
  const nextTransferNumber = useMemo(
    () =>
      generateTransferNumber(existingTransfers.map((t) => t.transferNumber)),
    [existingTransfers]
  );

  const [form, setForm] = useState<SiteTransferFormState>(() => ({
    transferNumber: '',
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

  // Source, destination and the items moving between them. The transfer number
  // is generated from the transfers that already exist, so it stays out of the
  // draft rather than being restored as a duplicate.
  const draftScope = useFormDraftScope();
  const draftValues = useMemo(
    () => ({ fields: { ...form, transferNumber: '' }, items }),
    [form, items]
  );
  const applyDraft = useCallback(
    (values: {
      fields: SiteTransferFormState;
      items: SiteTransferItemRow[];
    }) => {
      setForm((prev) => ({
        ...values.fields,
        transferNumber: prev.transferNumber,
      }));
      setItems(values.items);
    },
    []
  );
  const { draft, restoreDraft, discardDraft } = useFormDraft<{
    fields: SiteTransferFormState;
    items: SiteTransferItemRow[];
  }>({
    formId: FORM_DRAFT_IDS.SITE_TRANSFER,
    scope: draftScope,
    values: draftValues,
    onRestore: applyDraft,
  });

  // The field is read-only, so there is no user entry to preserve and the state
  // copy only exists to travel with the rest of the form to `onSubmit`. Keeping
  // it level with the derived value on every change of the list is what stops
  // the number sticking at whatever it was when the form first rendered.
  const [seededNumber, setSeededNumber] = useState<string | undefined>();
  if (seededNumber !== nextTransferNumber) {
    setSeededNumber(nextTransferNumber);
    setForm((prev) => ({ ...prev, transferNumber: nextTransferNumber }));
  }

  // ---------------------------------------------------------------------------
  // Storage locations available to each side
  // ---------------------------------------------------------------------------

  // A location with no project is organisation-level and offered from every
  // project; a location with a project belongs to that project alone. That is
  // the rule echno-backend#554 now enforces with a 400, so offering the wrong
  // pairing here only ever bought a rejected submit.
  const sendingLocations = useMemo(
    () => storageLocationsForProject(storageLocations, form.sendingProjectId),
    [storageLocations, form.sendingProjectId]
  );

  // Within one project, moving between two stores is a real transfer and stays
  // available. Only the same project at the same location is refused, because
  // both sides then resolve to one `current_stock` row and nothing moves.
  const receivingLocations = useMemo(() => {
    const scoped = storageLocationsForProject(
      storageLocations,
      form.receivingProjectId
    );
    if (
      !form.receivingProjectId ||
      form.receivingProjectId !== form.sendingProjectId
    ) {
      return scoped;
    }
    return scoped.filter(
      (location) => location.id !== form.sendingStorageLocationId
    );
  }, [
    storageLocations,
    form.receivingProjectId,
    form.sendingProjectId,
    form.sendingStorageLocationId,
  ]);

  // A location chosen before its project, or left over from a project since
  // changed, may no longer be on offer. Leaving it selected would send the
  // pairing the dropdown has just stopped showing. Each side is checked on its
  // own, so changing the sending project does not disturb the receiving side.
  if (
    form.sendingStorageLocationId &&
    !sendingLocations.some((l) => l.id === form.sendingStorageLocationId)
  ) {
    setForm((prev) => ({ ...prev, sendingStorageLocationId: 0 }));
  }
  if (
    form.receivingStorageLocationId &&
    !receivingLocations.some((l) => l.id === form.receivingStorageLocationId)
  ) {
    setForm((prev) => ({ ...prev, receivingStorageLocationId: 0 }));
  }

  // ---------------------------------------------------------------------------
  // Stock, scoped to what will actually be debited
  // ---------------------------------------------------------------------------

  // The sending side is the one being drawn down, so it is the sending project
  // and location that decide the figure, not the organisation aggregate the
  // table used to show.
  const rowMaterialIds = useMemo(
    () => items.map((item) => item.materialId),
    [items]
  );
  const stockByMaterial = useMaterialStocks(
    rowMaterialIds,
    form.sendingProjectId,
    form.sendingStorageLocationId
  );
  const sendingScopeChosen = Boolean(form.sendingProjectId);

  function unitFor(materialId: number) {
    return (
      stockByMaterial.get(materialId)?.unit ??
      materials.find((m) => m.id === materialId)?.unit ??
      ''
    );
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
      if (item.sentQuantity <= 0) {
        rowErr.sentQuantity = 'Must be > 0';
      } else {
        // The same balance the backend checks, so the shortfall is named here
        // rather than coming back as an insufficient-stock rejection.
        const available = stockByMaterial.get(item.materialId)?.currentStock;
        if (available !== undefined && item.sentQuantity > available) {
          rowErr.sentQuantity = `Only ${available} ${unitFor(item.materialId)} at the sending location`;
        }
      }
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
      <FormDraftBanner
        draft={draft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
        label="transfer"
      />
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
                  {sendingLocations.map((sl) => (
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
                  {receivingLocations.map((sl) => (
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
                            id={`materialId-${index}`}
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
                          <StockDisplay
                            stock={
                              stockByMaterial.get(item.materialId)?.currentStock
                            }
                            unit={unitFor(item.materialId)}
                            scoped={sendingScopeChosen}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Input
                          id={`sentQuantity-${index}`}
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
