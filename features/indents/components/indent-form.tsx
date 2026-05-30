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
import { FileText, Package, Plus, Trash2 } from 'lucide-react';
import { useMaterials } from '@/hooks/materials';
import { useIndents } from '@/hooks/indents';
import { useProjects } from '@/hooks/project/use-projects';
import { IndentStatus, indentStatusLabels } from '@/types/indents';
import { generateIndentNumber } from '@/lib/utils/document-number-utils';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IndentItemRow {
  materialId: number;
  requestedQuantity: number;
  additionalSpecifications: string;
  remarks: string;
}

export interface IndentFormState {
  indentNumber: string;
  status: IndentStatus;
  expectedOn: string;
  remarks: string;
  projectId: string;
}

export interface IndentSubmitData {
  form: IndentFormState;
  items: IndentItemRow[];
}

interface IndentFormProps {
  onSubmit: (data: IndentSubmitData) => void;
}

export const INDENT_FORM_ID = 'indent-form';

const EMPTY_ITEM: IndentItemRow = {
  materialId: 0,
  requestedQuantity: 1,
  additionalSpecifications: '',
  remarks: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IndentForm({ onSubmit }: IndentFormProps) {
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: existingIndents = [] } = useIndents();

  const [form, setForm] = useState<IndentFormState>(() => ({
    indentNumber: generateIndentNumber(
      existingIndents.map((i) => i.indentNumber)
    ),
    status: IndentStatus.pending,
    expectedOn: '',
    remarks: '',
    projectId: '',
  }));

  const [items, setItems] = useState<IndentItemRow[]>([{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Update indent number once existing indents load
  const [indentsSeeded, setIndentsSeeded] = useState(false);
  if (!indentsSeeded && existingIndents.length > 0) {
    setIndentsSeeded(true);
    setForm((prev) => ({
      ...prev,
      indentNumber:
        prev.indentNumber ||
        generateIndentNumber(existingIndents.map((i) => i.indentNumber)),
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

  function setField<K extends keyof IndentFormState>(
    field: K,
    value: IndentFormState[K]
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
    field: keyof IndentItemRow,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    clearRowError(index, String(field));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    const newRowErrors: Record<number, Record<string, string>> = {};

    const numberError = required('Indent number')(form.indentNumber);
    if (numberError) newErrors.indentNumber = numberError;

    const filledItems = items.filter((it) => it.materialId !== 0);
    if (filledItems.length === 0) {
      newErrors.items = 'At least one material must be selected';
    }

    for (const [i, item] of items.entries()) {
      if (item.materialId === 0) continue;
      const rowErr: Record<string, string> = {};
      if (item.requestedQuantity <= 0) rowErr.requestedQuantity = 'Must be > 0';
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
    onSubmit({ form, items: items.filter((it) => it.materialId !== 0) });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form id={INDENT_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
      {/* Indent Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Indent Details
          </CardTitle>
          <CardDescription>
            Basic information about this indent request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="indentNumber">
                Indent Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="indentNumber"
                placeholder="e.g. IND-2026-001"
                value={form.indentNumber}
                onChange={(e) => setField('indentNumber', e.target.value)}
                className={errors.indentNumber ? 'border-red-500' : ''}
              />
              {errors.indentNumber && (
                <p className="text-sm text-red-500">{errors.indentNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField('status', v as IndentStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IndentStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {indentStatusLabels[s]}
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
                value={form.projectId}
                onValueChange={(v) => setField('projectId', v)}
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
              <Label htmlFor="expectedOn">
                Expected On{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="expectedOn"
                type="date"
                value={form.expectedOn}
                onChange={(e) => setField('expectedOn', e.target.value)}
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
                placeholder="Additional notes or context for this indent..."
                value={form.remarks}
                onChange={(e) => setField('remarks', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requested Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Requested Items
          </CardTitle>
          <CardDescription>
            Add the materials you need for this indent
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {errors.items && (
            <p className="px-6 pt-4 text-sm text-red-500">{errors.items}</p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 pl-6">#</TableHead>
                  <TableHead className="min-w-[200px]">
                    Material <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-36">
                    Quantity <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="min-w-[160px]">
                    Specifications
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
                          value={item.materialId ? String(item.materialId) : ''}
                          onValueChange={(v) =>
                            updateItem(index, 'materialId', Number(v))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select material" />
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
                          min="1"
                          step="1"
                          value={item.requestedQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'requestedQuantity',
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className={`w-full ${rErr.requestedQuantity ? 'border-red-500' : ''}`}
                        />
                        {rErr.requestedQuantity && (
                          <p className="mt-1 text-xs text-red-500">
                            {rErr.requestedQuantity}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <Input
                          value={item.additionalSpecifications}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'additionalSpecifications',
                              e.target.value
                            )
                          }
                          placeholder="e.g. Grade A"
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
        </CardContent>
      </Card>
    </form>
  );
}
