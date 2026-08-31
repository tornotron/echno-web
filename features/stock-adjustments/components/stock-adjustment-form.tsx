'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
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
import { Separator } from '@/components/shadcn/separator';
import {
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useMaterialStocks } from '@/hooks/materials';
import { useMaterials } from '@tornotron/echno-core/materials/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useStorageLocations } from '@tornotron/echno-core/storage-locations/hooks';
import {
  isOutsideProjectScope,
  storageLocationsForAdjustment,
} from '@/lib/inventory/storage-location-scope';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';
import type { StockAdjustment } from '@/types/resource';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockAdjustmentItem {
  id: number;
  /**
   * The material this line adjusts. Approval posts one ledger entry per line
   * against this material's balance, so a line without it can be saved as a
   * draft and never posted.
   */
  materialId: number;
  description: string;
  /**
   * The balance the server holds for this line, read from the stock record at
   * the document's project and storage location. It is not typed and is not
   * held in form state: it is attached on submit from the figure the form
   * displayed, and is `undefined` when that read has not resolved or is not
   * permitted. See `openingBalanceFor`.
   */
  openingBalance?: number;
  countedStock: number;
  unit: string;
  unitCost: number;
  reason: string;
}

export interface StockAdjustmentFormState {
  adjustmentNumber: string;
  adjustmentDate: string;
  adjustmentType: string;
  /**
   * The project whose balance the document corrects. Required: a stock balance
   * is held per material, project and location, so an adjustment naming no
   * project has nothing to post against and the backend refuses to approve it.
   */
  projectId: number;
  /** The storage location counted, within the chosen project. */
  storageLocationId: number;
  adjustmentReason: string;
  notes: string;
}

export interface StockAdjustmentSubmitData {
  form: StockAdjustmentFormState;
  items: StockAdjustmentItem[];
}

interface StockAdjustmentFormProps {
  /**
   * An existing document to edit, or one to copy when raising a new one from
   * a rejected adjustment. A copy arrives with `adjustmentNumber` blank,
   * because the number has to be unique and the copy needs its own.
   */
  initial?: StockAdjustment;
  onSubmit: (data: StockAdjustmentSubmitData) => void;
}

export const STOCK_ADJUSTMENT_FORM_ID = 'stock-adjustment-form';

const ADJUSTMENT_TYPES = [
  'Physical Count',
  'Damage/Loss',
  'Expiry',
  'Correction',
  'Return',
  'Write-off',
];

const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'L', label: 'Liters' },
  { value: 'm', label: 'Meters' },
  { value: 'sqm', label: 'Square Meters' },
  { value: 'bags', label: 'Bags' },
  { value: 'boxes', label: 'Boxes' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The balance the line will be stamped against, shown rather than typed.
 *
 * It is a display and not an input because the server owns the figure: since
 * echno-backend#658 a stock adjustment's `systemQuantity` is read from the
 * stock when the document is saved, and anything sent for it is discarded. It
 * is still worth showing, because it is the number a count is being compared
 * against and the number a refused approval will name.
 *
 * @param props.stock - Balance at the document's project and storage location,
 *   undefined while the read is in flight or when it is not permitted.
 * @param props.unit - Unit to label the figure with.
 * @param props.scoped - Whether a project and a storage location have both been
 *   chosen, which is what makes a balance readable at all.
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
      <p className="text-sm text-zinc-400">
        Choose a project and a storage location.
      </p>
    );
  }
  if (stock === undefined) {
    return <p className="text-sm text-zinc-400">Not available</p>;
  }
  return (
    <p
      className={`text-sm font-medium ${stock <= 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}
    >
      {stock <= 0 && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
      {stock} {unit}
    </p>
  );
}

/** A blank line, used for a new document and by "Add Item". */
function blankItem(id: number): StockAdjustmentItem {
  return {
    id,
    materialId: 0,
    description: '',
    countedStock: 0,
    unit: 'pcs',
    unitCost: 0,
    reason: '',
  };
}

export function StockAdjustmentForm({
  initial,
  onSubmit,
}: StockAdjustmentFormProps) {
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations } = useStorageLocations();

  const [form, setForm] = useState<StockAdjustmentFormState>(() => ({
    // `||` rather than `??`: a copy comes in with the number blanked, and a
    // blank number needs generating just as an absent one does.
    adjustmentNumber:
      initial?.adjustmentNumber ||
      `SA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10_000)
        .toString()
        .padStart(4, '0')}`,
    adjustmentDate: format(initial?.adjustmentDate ?? new Date(), 'yyyy-MM-dd'),
    adjustmentType: initial?.type ?? 'Physical Count',
    projectId: initial?.projectId ?? 0,
    storageLocationId: initial?.locationId ?? 0,
    adjustmentReason: initial?.justification ?? initial?.primaryReason ?? '',
    notes: initial?.notes ?? '',
  }));

  const [items, setItems] = useState<StockAdjustmentItem[]>(() =>
    initial && initial.lineItems.length > 0
      ? initial.lineItems.map((line, index) => ({
          id: line.id || index + 1,
          materialId: line.materialId ?? 0,
          description: line.description,
          // The line's stored `systemQuantity` is deliberately not carried
          // over. It is the balance as it stood when the document was last
          // saved, and saving again restamps it, so the figure this form has
          // to show is the live one. On a document held back by a moved
          // balance, showing the stale figure would hide the very thing that
          // refused the approval.
          countedStock: line.physicalQuantity,
          unit: line.unit || 'pcs',
          unitCost: line.unitValue,
          reason: line.reason || line.reasonDetails || '',
        }))
      : [blankItem(1)]
  );

  /**
   * Whether the document corrects a balance already held at a location another
   * project owns, which is the one case the backend lets an adjustment book
   * outside its project's locations. Off by default: the ordinary document is
   * an ordinary one, and this widens the dropdown to every location in the
   * organisation.
   */
  const [correctingExistingBalance, setCorrectingExistingBalance] =
    useState(false);
  /** Whether the widening has been decided from the document it opened with. */
  const [scopeDecided, setScopeDecided] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<
    Record<number, Record<string, string>>
  >({});

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

  function setField<K extends keyof StockAdjustmentFormState>(
    field: K,
    value: StockAdjustmentFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  function clearItemError(id: number, field: string) {
    setItemErrors((prev) => {
      const row = prev[id];
      if (!row?.[field]) return prev;
      const next = { ...row };
      delete next[field];
      return { ...prev, [id]: next };
    });
  }

  // ---------------------------------------------------------------------------
  // Item management
  // ---------------------------------------------------------------------------

  function addItem() {
    const nextId = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems((prev) => [...prev, blankItem(nextId)]);
  }

  function removeItem(id: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateItem(
    id: number,
    field: keyof StockAdjustmentItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    clearItemError(id, String(field));
  }

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  // The balance a line will be stamped against, read at the same (material,
  // project, storage location) row the backend reads in `stampOpeningBalance`.
  // The ids are withheld until both the project and the location are chosen:
  // with only a project the hook widens to that project's total across its
  // locations, which is not the row anything is checked against, and showing it
  // would put a wrong figure where the right one goes.
  const balanceScopeChosen = Boolean(form.projectId && form.storageLocationId);
  const rowMaterialIds = useMemo(
    () => (balanceScopeChosen ? items.map((item) => item.materialId) : []),
    [balanceScopeChosen, items]
  );
  const stockByMaterial = useMaterialStocks(
    rowMaterialIds,
    form.projectId,
    form.storageLocationId
  );

  /**
   * The opening balance for a line, or `undefined` when it is not available:
   * the read is still in flight, or the caller holds `project-manager` without
   * `system-admin` and the materials stock endpoint refuses them
   * (echno-backend#666).
   *
   * Undefined is carried through the arithmetic below rather than collapsed to
   * zero. A zero here is a claim that the shelf is empty, and every figure
   * derived from it says the whole counted quantity is a surplus. That is the
   * defect this replaced: the old free-text box defaulted to `0` and nothing
   * ever read the stock.
   */
  function openingBalanceFor(materialId: number) {
    return stockByMaterial.get(materialId)?.currentStock;
  }

  function itemDifference(item: StockAdjustmentItem) {
    const opening = openingBalanceFor(item.materialId);
    return opening === undefined ? undefined : item.countedStock - opening;
  }

  function itemImpact(item: StockAdjustmentItem) {
    const difference = itemDifference(item);
    return difference === undefined ? undefined : difference * item.unitCost;
  }

  const totalImpact = items.reduce(
    (sum, item) => sum + (itemImpact(item) ?? 0),
    0
  );
  const surplusItems = items.filter(
    (item) => (itemDifference(item) ?? 0) > 0
  ).length;
  const shortageItems = items.filter(
    (item) => (itemDifference(item) ?? 0) < 0
  ).length;

  // ---------------------------------------------------------------------------
  // Storage locations available to the chosen project
  // ---------------------------------------------------------------------------

  // A document that already sits on another project's location is the shape the
  // widening exists for, so it opens with the widening on. Without it the reset
  // below drops the location the document came with, on the very documents the
  // relaxation was added for.
  //
  // It is read on the same pass that records it rather than waiting for the
  // state to land, because the reset runs on this pass too and would clear the
  // location before the decision took effect.
  const opensWidened =
    !scopeDecided &&
    storageLocations !== undefined &&
    isOutsideProjectScope(
      storageLocations,
      form.projectId,
      form.storageLocationId
    );
  const correcting = correctingExistingBalance || opensWidened;

  // The decision is taken once, when the location list first resolves, and is
  // not held as an invariant afterwards: the user has to be able to turn the
  // widening back off, and re-deciding on every render would tick the box again
  // as fast as they cleared it.
  if (storageLocations !== undefined && !scopeDecided) {
    setScopeDecided(true);
    if (opensWidened) {
      setCorrectingExistingBalance(true);
    }
  }

  // A balance row sits at one (material, project, location) triple, so offering
  // a location that belongs to another project only ever produces a document
  // that cannot be posted. The exception is a document correcting a balance
  // that is already sitting on such a pairing: see
  // `storageLocationsForAdjustment`.
  const availableLocations = useMemo(
    () =>
      storageLocationsForAdjustment(
        storageLocations ?? [],
        form.projectId,
        correcting
      ),
    [storageLocations, form.projectId, correcting]
  );

  // The reset waits for the location query to resolve. Until then the list is
  // empty for every id, and firing on that emptiness wiped the location a
  // document being edited or copied arrived with: the field fell back to its
  // placeholder, and whoever re-picked from memory could silently move the
  // adjustment onto a different balance row.
  if (
    storageLocations !== undefined &&
    form.storageLocationId &&
    !availableLocations.some((l) => l.id === form.storageLocationId)
  ) {
    setForm((prev) => ({ ...prev, storageLocationId: 0 }));
  }

  /**
   * Picking the material fills the unit and, where the line is still blank, the
   * description. The unit is the material's own, so the quantities on the line
   * and the balance they post against are counted in the same thing.
   */
  function selectMaterial(itemId: number, materialId: number) {
    const material = materials.find((m) => m.id === materialId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              materialId,
              unit: material?.unit || item.unit,
              description: item.description || material?.materialName || '',
            }
          : item
      )
    );
    clearItemError(itemId, 'materialId');
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    const newItemErrors: Record<number, Record<string, string>> = {};

    // The project is what makes the document approvable at all, so it is
    // required here rather than left for the approval to refuse.
    if (!form.projectId) newErrors.projectId = 'Project is required';
    if (!form.storageLocationId)
      newErrors.storageLocationId = 'Storage location is required';

    const reasonError = required('Reason')(form.adjustmentReason);
    if (reasonError) newErrors.adjustmentReason = reasonError;

    for (const item of items) {
      const rowErr: Record<string, string> = {};
      if (!item.materialId) rowErr.materialId = 'Material is required';
      const descError = required('Description')(item.description);
      if (descError) rowErr.description = descError;
      const itemReasonError = required('Reason')(item.reason);
      if (itemReasonError) rowErr.reason = itemReasonError;
      if (Object.keys(rowErr).length > 0) newItemErrors[item.id] = rowErr;
    }

    setErrors(newErrors);
    setItemErrors(newItemErrors);

    return (
      Object.keys(newErrors).length === 0 &&
      Object.keys(newItemErrors).length === 0
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
    // The balance goes out with the lines so the value figures on the payload
    // are arithmetic over the figure the person submitting was looking at,
    // rather than over a number they typed. The server stamps its own opening
    // balance and variance regardless; what this carries is the money.
    onSubmit({
      form,
      items: items.map((item) => ({
        ...item,
        openingBalance: openingBalanceFor(item.materialId),
      })),
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      id={STOCK_ADJUSTMENT_FORM_ID}
      onSubmit={handleSubmit}
      className="mx-auto max-w-7xl"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General adjustment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adjustmentNumber">Adjustment Number</Label>
                  <Input
                    id="adjustmentNumber"
                    value={form.adjustmentNumber}
                    disabled
                    className="bg-zinc-50 font-mono dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustmentDate">
                    Adjustment Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adjustmentDate"
                    type="date"
                    value={form.adjustmentDate}
                    onChange={(e) => setField('adjustmentDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustmentType">
                    Adjustment Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.adjustmentType}
                    onValueChange={(v) => setField('adjustmentType', v)}
                  >
                    <SelectTrigger id="adjustmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADJUSTMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
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
                    onValueChange={(v) => v && setField('projectId', Number(v))}
                  >
                    <SelectTrigger
                      id="projectId"
                      className={errors.projectId ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    The balance this adjustment corrects is held per project. An
                    adjustment without one cannot be approved.
                  </p>
                  {errors.projectId && (
                    <p className="text-sm text-red-500">{errors.projectId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storageLocationId">
                    Storage Location <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={
                      form.storageLocationId
                        ? String(form.storageLocationId)
                        : ''
                    }
                    onValueChange={(v) =>
                      // Radix reports an empty value when the selected item is
                      // not among the mounted options, which is every render
                      // until the location query resolves. Nothing a user can
                      // pick is empty, so this only drops that spurious clear.
                      v ? setField('storageLocationId', Number(v)) : undefined
                    }
                  >
                    <SelectTrigger
                      id="storageLocationId"
                      className={
                        errors.storageLocationId ? 'border-red-500' : ''
                      }
                    >
                      <SelectValue placeholder="Select storage location" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLocations.map((location) => (
                        <SelectItem
                          key={location.id}
                          value={String(location.id)}
                        >
                          {location.locationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.storageLocationId && (
                    <p className="text-sm text-red-500">
                      {errors.storageLocationId}
                    </p>
                  )}
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="correctingExistingBalance"
                      checked={correcting}
                      onCheckedChange={(checked) =>
                        setCorrectingExistingBalance(checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="correctingExistingBalance"
                        className="text-sm font-normal"
                      >
                        This corrects a balance held at another project&apos;s
                        location
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Offers every location in the organization. An adjustment
                        may correct a balance that already sits on a location
                        owned by another project, but it cannot create one, so a
                        location holding nothing for this material and project
                        is still refused on approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentReason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="adjustmentReason"
                  value={form.adjustmentReason}
                  onChange={(e) => setField('adjustmentReason', e.target.value)}
                  placeholder="Describe the reason for this adjustment..."
                  rows={3}
                  className={`resize-none ${errors.adjustmentReason ? 'border-red-500' : ''}`}
                />
                {errors.adjustmentReason && (
                  <p className="text-sm text-red-500">
                    {errors.adjustmentReason}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Additional Notes{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Any additional notes or observations..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Adjustment Items</CardTitle>
                  <CardDescription>Items being adjusted</CardDescription>
                </div>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => {
                const diff = itemDifference(item);
                const impact = itemImpact(item);
                const iErr = itemErrors[item.id] ?? {};

                return (
                  <div
                    key={item.id}
                    className="space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Item #{index + 1}
                      </h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>
                          Material <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={item.materialId ? String(item.materialId) : ''}
                          onValueChange={(v) =>
                            selectMaterial(item.id, Number(v))
                          }
                        >
                          <SelectTrigger
                            className={iErr.materialId ? 'border-red-500' : ''}
                          >
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem
                                key={material.id}
                                value={String(material.id)}
                              >
                                {material.materialName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {iErr.materialId && (
                          <p className="text-sm text-red-500">
                            {iErr.materialId}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label>
                          Item Description{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, 'description', e.target.value)
                          }
                          placeholder="Item description"
                          className={iErr.description ? 'border-red-500' : ''}
                        />
                        {iErr.description && (
                          <p className="text-sm text-red-500">
                            {iErr.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Current Stock</Label>
                        <div className="flex h-9 items-center">
                          {item.materialId ? (
                            <StockDisplay
                              stock={openingBalanceFor(item.materialId)}
                              unit={item.unit}
                              scoped={balanceScopeChosen}
                            />
                          ) : (
                            <p className="text-sm text-zinc-400">
                              Select a material.
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Read from the stock record when the document is saved.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Counted Stock</Label>
                        <Input
                          type="number"
                          value={item.countedStock || ''}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'countedStock',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItem(item.id, 'unit', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Cost (₹)</Label>
                        <Input
                          type="number"
                          value={item.unitCost || ''}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'unitCost',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label>
                          Reason for Adjustment{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={item.reason}
                          onChange={(e) =>
                            updateItem(item.id, 'reason', e.target.value)
                          }
                          placeholder="Explain why this adjustment is being made..."
                          rows={2}
                          className={`resize-none ${iErr.reason ? 'border-red-500' : ''}`}
                        />
                        {iErr.reason && (
                          <p className="text-sm text-red-500">{iErr.reason}</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Difference:
                        </span>
                        <div className="flex items-center gap-1">
                          {diff !== undefined && diff > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : diff !== undefined && diff < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : null}
                          <span
                            className={`font-semibold ${
                              diff !== undefined && diff > 0
                                ? 'text-green-600 dark:text-green-400'
                                : diff !== undefined && diff < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {diff === undefined ? (
                              '—'
                            ) : (
                              <>
                                {diff > 0 ? '+' : ''}
                                {diff} {item.unit}
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Impact:
                        </span>
                        <span
                          className={`font-semibold ${
                            impact !== undefined && impact > 0
                              ? 'text-green-600 dark:text-green-400'
                              : impact !== undefined && impact < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {impact === undefined
                            ? '—'
                            : `${impact > 0 ? '+' : ''}₹${impact.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Total Items:
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Surplus Items:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {surplusItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Shortage Items:
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {shortageItems}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Net Impact:
                </span>
                <span
                  className={`text-lg font-bold ${
                    totalImpact > 0
                      ? 'text-green-600 dark:text-green-400'
                      : totalImpact < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {totalImpact > 0 ? '+' : ''}₹
                  {(Math.abs(totalImpact) / 1000).toFixed(2)}K
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>• Ensure accurate counted stock numbers</p>
              <p>• Provide clear reasons for each adjustment</p>
              <p>• Double-check unit costs for financial accuracy</p>
              <p>• Document any unusual findings in notes</p>
              <p>• Review summary before submitting</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
