'use client';

import { useState } from 'react';
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
import { FlameKindling, AlertTriangle } from 'lucide-react';
import { useMaterials, useMaterialWithStock } from '@/hooks/materials';
import { useProjects } from '@/hooks/project/use-projects';
import { useStorageLocations } from '@/hooks/storage-locations/use-storage-locations';
import { useTasks } from '@/hooks/task/use-tasks';
import { ConsumptionType, consumptionTypeLabels } from '@/types/materials';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MaterialConsumptionFormState {
  consumptionDate: string;
  materialId: number;
  quantity: string;
  consumptionType: ConsumptionType;
  projectId: number;
  storageLocationId: number;
  taskId: number;
  details: string;
}

export interface MaterialConsumptionSubmitData {
  form: MaterialConsumptionFormState;
}

interface MaterialConsumptionFormProps {
  fromTaskId?: number;
  fromTaskTitle?: string;
  onSubmit: (data: MaterialConsumptionSubmitData) => void;
}

export const MATERIAL_CONSUMPTION_FORM_ID = 'material-consumption-form';

// ---------------------------------------------------------------------------
// Stock display sub-component
// ---------------------------------------------------------------------------

function StockDisplay({ materialId }: { materialId: number }) {
  const { data } = useMaterialWithStock(materialId);
  if (!data) return null;
  const stock = data.currentStock ?? 0;
  return (
    <p
      className={`text-xs ${stock <= 0 ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
    >
      {stock <= 0 && <AlertTriangle className="mr-1 inline h-3 w-3" />}
      Current stock: {stock} {data.unit}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaterialConsumptionForm({
  fromTaskId = 0,
  fromTaskTitle = '',
  onSubmit,
}: MaterialConsumptionFormProps) {
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: tasks = [] } = useTasks();

  const [form, setForm] = useState<MaterialConsumptionFormState>({
    consumptionDate: new Date().toISOString().slice(0, 10),
    materialId: 0,
    quantity: '',
    consumptionType: ConsumptionType.usedFromStock,
    projectId: 0,
    storageLocationId: 0,
    taskId: fromTaskId,
    details: '',
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

  function setField<K extends keyof MaterialConsumptionFormState>(
    field: K,
    value: MaterialConsumptionFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    const dateError = required('Date')(form.consumptionDate);
    if (dateError) newErrors.consumptionDate = dateError;

    if (!form.materialId) newErrors.materialId = 'Material is required';

    const qty = Number.parseInt(form.quantity, 10);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0)
      newErrors.quantity = 'Quantity must be greater than 0';

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
    onSubmit({ form });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      id={MATERIAL_CONSUMPTION_FORM_ID}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Consumption Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlameKindling className="h-5 w-5" />
            Consumption Details
          </CardTitle>
          <CardDescription>Material and quantity information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consumptionDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="consumptionDate"
                type="date"
                value={form.consumptionDate}
                onChange={(e) => setField('consumptionDate', e.target.value)}
                className={errors.consumptionDate ? 'border-red-500' : ''}
              />
              {errors.consumptionDate && (
                <p className="text-sm text-red-500">{errors.consumptionDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumptionType">
                Consumption Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.consumptionType}
                onValueChange={(v) =>
                  setField('consumptionType', v as ConsumptionType)
                }
              >
                <SelectTrigger id="consumptionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ConsumptionType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {consumptionTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialId">
                Material <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.materialId ? String(form.materialId) : ''}
                onValueChange={(v) => setField('materialId', Number(v))}
              >
                <SelectTrigger
                  id="materialId"
                  className={errors.materialId ? 'border-red-500' : ''}
                >
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
              {errors.materialId && (
                <p className="text-sm text-red-500">{errors.materialId}</p>
              )}
              {form.materialId > 0 && (
                <StockDisplay materialId={form.materialId} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
                placeholder="0"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Context</CardTitle>
          <CardDescription>
            Optional — link to a project, task, or storage location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="taskId">
                Task{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              {fromTaskId > 0 ? (
                <div className="flex h-10 items-center rounded-md border bg-zinc-50 px-3 text-sm dark:bg-zinc-900">
                  {fromTaskTitle || `Task #${fromTaskId}`}
                </div>
              ) : (
                <Select
                  value={form.taskId ? String(form.taskId) : 'none'}
                  onValueChange={(v) =>
                    setField('taskId', v === 'none' ? 0 : Number(v))
                  }
                >
                  <SelectTrigger id="taskId">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="details">
                Details{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="details"
                value={form.details}
                onChange={(e) => setField('details', e.target.value)}
                placeholder="Additional notes about this consumption..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
