'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
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
import { Info, RotateCcw } from 'lucide-react';
import { useStorageLocations } from '@tornotron/echno-core/storage-locations/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { MaterialUnitSelector } from './material-unit-selector';
import { Material } from '@tornotron/echno-core/materials/types';
import { CreateMaterialRequest } from '@tornotron/echno-core/materials/types';
import { UpdateMaterialRequest } from '@tornotron/echno-core/materials/types';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = {
  materialName: string;
  sku: string;
  unit: string;
  description: string;
  hsn: string;
  gstRate: string;
  openingStock: string;
  unitCost: string;
  storageLocationId: string;
  projectId: string;
  moq: string;
  minStock: string;
  maxStock: string;
  safetyStock: string;
  reorderLevel: string;
  ltc: string;
};

type DerivedField = 'minStock' | 'reorderLevel' | 'maxStock';
type Overrides = Record<DerivedField, boolean>;

const EMPTY_FORM: FormState = {
  materialName: '',
  sku: '',
  unit: '',
  description: '',
  hsn: '',
  gstRate: '',
  openingStock: '',
  unitCost: '',
  storageLocationId: '',
  projectId: '',
  moq: '',
  minStock: '',
  maxStock: '',
  safetyStock: '',
  reorderLevel: '',
  ltc: '',
};

// ---------------------------------------------------------------------------
// Threshold auto-compute
// ---------------------------------------------------------------------------

function recomputeThresholds(
  base: FormState,
  ovr: Overrides
): Partial<FormState> {
  const safety = Number(base.safetyStock) || 0;
  const ltcVal = Number(base.ltc) || 0;
  const moqVal = Number(base.moq) || 0;

  const computedMin = safety + ltcVal;
  const effectiveMin = ovr.minStock ? Number(base.minStock) || 0 : computedMin;

  const computedReorder = effectiveMin + ltcVal;
  const effectiveReorder = ovr.reorderLevel
    ? Number(base.reorderLevel) || 0
    : computedReorder;

  const computedMax = Math.max(0, effectiveReorder + moqVal - ltcVal);

  return {
    ...(ovr.minStock ? {} : { minStock: String(computedMin) }),
    ...(ovr.reorderLevel ? {} : { reorderLevel: String(computedReorder) }),
    ...(ovr.maxStock ? {} : { maxStock: String(computedMax) }),
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateProps {
  mode: 'create';
  createdBy: number;
  onSubmit: (data: CreateMaterialRequest) => void;
}

interface EditProps {
  mode: 'edit';
  material: Material;
  onSubmit: (data: UpdateMaterialRequest) => void;
}

type MaterialFormProps = CreateProps | EditProps;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MATERIAL_FORM_ID = 'material-form';

export function MaterialForm(props: MaterialFormProps) {
  const { mode } = props;
  const isEdit = mode === 'edit';

  const { data: storageLocations = [] } = useStorageLocations();
  const { data: projects = [] } = useProjects();

  const defaultOverrides: Overrides = isEdit
    ? { minStock: true, reorderLevel: true, maxStock: true }
    : { minStock: false, reorderLevel: false, maxStock: false };

  const overridesRef = useRef<Overrides>(defaultOverrides);
  const [overrides, _setOverrides] = useState<Overrides>(defaultOverrides);

  function setOverrides(next: Overrides) {
    overridesRef.current = next;
    _setOverrides(next);
  }

  const [form, setForm] = useState<FormState>(() => {
    if (props.mode !== 'edit') return EMPTY_FORM;
    const m = (props as EditProps).material;
    return {
      materialName: m.materialName,
      sku: m.sku ?? '',
      unit: m.unit,
      description: m.description ?? '',
      hsn: m.hsn ?? '',
      gstRate: m.gstRate === undefined ? '' : String(m.gstRate),
      openingStock: m.openingStock === undefined ? '' : String(m.openingStock),
      unitCost: '',
      storageLocationId: m.storageLocationId ? String(m.storageLocationId) : '',
      projectId: m.projectId ? String(m.projectId) : '',
      moq: m.moq === undefined ? '' : String(m.moq),
      minStock: m.minStock === undefined ? '' : String(m.minStock),
      maxStock: m.maxStock === undefined ? '' : String(m.maxStock),
      safetyStock: m.safetyStock === undefined ? '' : String(m.safetyStock),
      reorderLevel: m.reorderLevel === undefined ? '' : String(m.reorderLevel),
      ltc: m.ltc === undefined ? '' : String(m.ltc),
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  function handleSourceChange(field: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      return { ...next, ...recomputeThresholds(next, overridesRef.current) };
    });
    clearError(field);
  }

  function handleDerivedChange(field: DerivedField, value: string) {
    const next = { ...overridesRef.current, [field]: true };
    setOverrides(next);
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      return { ...updated, ...recomputeThresholds(updated, next) };
    });
    clearError(field);
  }

  function resetDerived(field: DerivedField) {
    const next = { ...overridesRef.current, [field]: false };
    setOverrides(next);
    setForm((prev) => ({ ...prev, ...recomputeThresholds(prev, next) }));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const hasOpeningStock =
    !isEdit && form.openingStock !== '' && Number(form.openingStock) > 0;

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    const nameError = required('Material name')(form.materialName);
    if (nameError) newErrors.materialName = nameError;

    const unitError = required('Unit')(form.unit);
    if (unitError) newErrors.unit = unitError;

    if (hasOpeningStock && form.unitCost === '') {
      newErrors.unitCost = 'Unit cost is required when opening stock is set';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    if (mode === 'create') {
      (props as CreateProps).onSubmit({
        materialName: form.materialName.trim(),
        sku: form.sku.trim() || undefined,
        unit: form.unit.trim(),
        createdBy: (props as CreateProps).createdBy,
        description: form.description.trim() || undefined,
        hsn: form.hsn.trim() || undefined,
        gstRate: form.gstRate === '' ? null : Number(form.gstRate),
        openingStock:
          form.openingStock === '' ? null : Number(form.openingStock),
        unitCost:
          hasOpeningStock && form.unitCost !== ''
            ? Number(form.unitCost)
            : undefined,
        storageLocationId:
          hasOpeningStock && form.storageLocationId
            ? Number(form.storageLocationId)
            : null,
        projectId:
          hasOpeningStock && form.projectId ? Number(form.projectId) : null,
        moq: form.moq === '' ? undefined : Number(form.moq),
        minStock: form.minStock === '' ? undefined : Number(form.minStock),
        maxStock: form.maxStock === '' ? undefined : Number(form.maxStock),
        safetyStock:
          form.safetyStock === '' ? undefined : Number(form.safetyStock),
        reorderLevel:
          form.reorderLevel === '' ? undefined : Number(form.reorderLevel),
        ltc: form.ltc === '' ? undefined : Number(form.ltc),
      });
    } else {
      (props as EditProps).onSubmit({
        materialName: form.materialName.trim(),
        sku: form.sku.trim() || undefined,
        unit: form.unit.trim(),
        description: form.description.trim() || undefined,
        hsn: form.hsn.trim() || undefined,
        gstRate: form.gstRate === '' ? null : Number(form.gstRate),
        moq: form.moq === '' ? undefined : Number(form.moq),
        minStock: form.minStock === '' ? undefined : Number(form.minStock),
        maxStock: form.maxStock === '' ? undefined : Number(form.maxStock),
        safetyStock:
          form.safetyStock === '' ? undefined : Number(form.safetyStock),
        reorderLevel:
          form.reorderLevel === '' ? undefined : Number(form.reorderLevel),
        ltc: form.ltc === '' ? undefined : Number(form.ltc),
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form id={MATERIAL_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left — main content (2 cols) */}
        <div className="space-y-6 md:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the basic details of the material'
                  : 'Enter the basic details of the material'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="materialName">
                    Material Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="materialName"
                    placeholder="e.g. Portland Cement"
                    value={form.materialName}
                    onChange={(e) => set('materialName', e.target.value)}
                    className={errors.materialName ? 'border-red-500' : ''}
                  />
                  {errors.materialName && (
                    <p className="text-sm text-red-500">
                      {errors.materialName}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter material description..."
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="e.g. CEM-55"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <MaterialUnitSelector
                    id="unit"
                    value={form.unit}
                    onValueChange={(v) => set('unit', v)}
                    className={errors.unit ? 'border-red-500' : ''}
                  />
                  {errors.unit && (
                    <p className="text-sm text-red-500">{errors.unit}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsn">HSN Code</Label>
                  <Input
                    id="hsn"
                    placeholder="e.g. 09988567"
                    value={form.hsn}
                    onChange={(e) => set('hsn', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstRate">GST Rate (%)</Label>
                  <Input
                    id="gstRate"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 18"
                    value={form.gstRate}
                    onChange={(e) => set('gstRate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Thresholds</CardTitle>
              <CardDescription>
                Define stock control levels for this material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="moq">Min. Order Quantity (MOQ)</Label>
                  <Input
                    id="moq"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.moq}
                    onChange={(e) => handleSourceChange('moq', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safetyStock">Safety Stock</Label>
                  <Input
                    id="safetyStock"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.safetyStock}
                    onChange={(e) =>
                      handleSourceChange('safetyStock', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ltc">Lead Time Consumption (LTC)</Label>
                  <Input
                    id="ltc"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.ltc}
                    onChange={(e) => handleSourceChange('ltc', e.target.value)}
                  />
                </div>

                {/* Derived: Min Stock */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="minStock">
                      Min Stock
                      {!overrides.minStock && (
                        <span className="ml-1.5 text-xs font-normal text-blue-500">
                          (auto)
                        </span>
                      )}
                    </Label>
                    {overrides.minStock && (
                      <button
                        type="button"
                        onClick={() => resetDerived('minStock')}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <RotateCcw className="size-3" />
                        Auto
                      </button>
                    )}
                  </div>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.minStock}
                    onChange={(e) =>
                      handleDerivedChange('minStock', e.target.value)
                    }
                    className={
                      overrides.minStock
                        ? ''
                        : 'bg-blue-50/50 dark:bg-blue-950/10'
                    }
                  />
                </div>

                {/* Derived: Reorder Level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reorderLevel">
                      Reorder Level
                      {!overrides.reorderLevel && (
                        <span className="ml-1.5 text-xs font-normal text-blue-500">
                          (auto)
                        </span>
                      )}
                    </Label>
                    {overrides.reorderLevel && (
                      <button
                        type="button"
                        onClick={() => resetDerived('reorderLevel')}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <RotateCcw className="size-3" />
                        Auto
                      </button>
                    )}
                  </div>
                  <Input
                    id="reorderLevel"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.reorderLevel}
                    onChange={(e) =>
                      handleDerivedChange('reorderLevel', e.target.value)
                    }
                    className={
                      overrides.reorderLevel
                        ? ''
                        : 'bg-blue-50/50 dark:bg-blue-950/10'
                    }
                  />
                </div>

                {/* Derived: Max Stock */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxStock">
                      Max Stock
                      {!overrides.maxStock && (
                        <span className="ml-1.5 text-xs font-normal text-blue-500">
                          (auto)
                        </span>
                      )}
                    </Label>
                    {overrides.maxStock && (
                      <button
                        type="button"
                        onClick={() => resetDerived('maxStock')}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <RotateCcw className="size-3" />
                        Auto
                      </button>
                    )}
                  </div>
                  <Input
                    id="maxStock"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.maxStock}
                    onChange={(e) =>
                      handleDerivedChange('maxStock', e.target.value)
                    }
                    className={
                      overrides.maxStock
                        ? ''
                        : 'bg-blue-50/50 dark:bg-blue-950/10'
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar — only shown in create mode */}
        {!isEdit && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock &amp; Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openingStock">Opening Stock</Label>
                  <Input
                    id="openingStock"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.openingStock}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        openingStock: val,
                        ...((!val || Number(val) <= 0) && {
                          unitCost: '',
                          storageLocationId: '',
                          projectId: '',
                        }),
                      }));
                      clearError('openingStock');
                    }}
                  />
                  <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    Only add opening stock if this material already has existing
                    stock at the time of creation.
                  </p>
                </div>

                {hasOpeningStock && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="unitCost">
                        Unit Cost <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="unitCost"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={form.unitCost}
                        onChange={(e) => set('unitCost', e.target.value)}
                        className={errors.unitCost ? 'border-red-500' : ''}
                      />
                      {errors.unitCost && (
                        <p className="text-sm text-red-500">
                          {errors.unitCost}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storageLocationId">
                        Storage Location
                      </Label>
                      <Select
                        value={form.storageLocationId || 'none'}
                        onValueChange={(v) =>
                          set('storageLocationId', v === 'none' ? '' : v)
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
                      <Label htmlFor="projectId">Project</Label>
                      <Select
                        value={form.projectId || 'none'}
                        onValueChange={(v) =>
                          set('projectId', v === 'none' ? '' : v)
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </form>
  );
}
