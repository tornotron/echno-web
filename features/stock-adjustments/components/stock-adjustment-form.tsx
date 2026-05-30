'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Separator } from '@/components/shadcn/separator';
import {
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockAdjustmentItem {
  id: number;
  description: string;
  currentStock: number;
  countedStock: number;
  unit: string;
  unitCost: number;
  reason: string;
}

export interface StockAdjustmentFormState {
  adjustmentNumber: string;
  adjustmentDate: string;
  adjustmentType: string;
  location: string;
  adjustmentReason: string;
  notes: string;
}

export interface StockAdjustmentSubmitData {
  form: StockAdjustmentFormState;
  items: StockAdjustmentItem[];
}

interface StockAdjustmentFormProps {
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

const LOCATIONS = [
  'Warehouse A',
  'Warehouse B',
  'Site A - Building Project',
  'Site B - Bridge Construction',
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

export function StockAdjustmentForm({ onSubmit }: StockAdjustmentFormProps) {
  const [form, setForm] = useState<StockAdjustmentFormState>(() => ({
    adjustmentNumber: `SA-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10_000
    )
      .toString()
      .padStart(4, '0')}`,
    adjustmentDate: format(new Date(), 'yyyy-MM-dd'),
    adjustmentType: 'Physical Count',
    location: '',
    adjustmentReason: '',
    notes: '',
  }));

  const [items, setItems] = useState<StockAdjustmentItem[]>([
    {
      id: 1,
      description: '',
      currentStock: 0,
      countedStock: 0,
      unit: 'pcs',
      unitCost: 0,
      reason: '',
    },
  ]);

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
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        description: '',
        currentStock: 0,
        countedStock: 0,
        unit: 'pcs',
        unitCost: 0,
        reason: '',
      },
    ]);
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

  function itemDifference(item: StockAdjustmentItem) {
    return item.countedStock - item.currentStock;
  }

  function itemImpact(item: StockAdjustmentItem) {
    return itemDifference(item) * item.unitCost;
  }

  const totalImpact = items.reduce((sum, item) => sum + itemImpact(item), 0);
  const surplusItems = items.filter((item) => itemDifference(item) > 0).length;
  const shortageItems = items.filter((item) => itemDifference(item) < 0).length;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    const newItemErrors: Record<number, Record<string, string>> = {};

    const locationError = required('Location')(form.location);
    if (locationError) newErrors.location = locationError;

    const reasonError = required('Reason')(form.adjustmentReason);
    if (reasonError) newErrors.adjustmentReason = reasonError;

    for (const item of items) {
      const rowErr: Record<string, string> = {};
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
    onSubmit({ form, items });
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
                  <Label htmlFor="location">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.location}
                    onValueChange={(v) => setField('location', v)}
                  >
                    <SelectTrigger
                      id="location"
                      className={errors.location ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location}</p>
                  )}
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
                        <Input
                          type="number"
                          value={item.currentStock || ''}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'currentStock',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                        />
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
                          {diff > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : diff < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : null}
                          <span
                            className={`font-semibold ${
                              diff > 0
                                ? 'text-green-600 dark:text-green-400'
                                : diff < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {diff} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Impact:
                        </span>
                        <span
                          className={`font-semibold ${
                            impact > 0
                              ? 'text-green-600 dark:text-green-400'
                              : impact < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {impact > 0 ? '+' : ''}₹{impact.toLocaleString()}
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
