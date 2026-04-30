'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  FlameKindling,
  Loader2,
  Send,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  useMaterials,
  useMaterialWithStock,
  useCreateConsumption,
} from '@/hooks/materials';
import { useProjects } from '@/hooks/project/use-projects';
import { useStorageLocations } from '@/hooks/storage-locations/use-storage-locations';
import { useTasks } from '@/hooks/task/use-tasks';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { ConsumptionType, consumptionTypeLabels } from '@/types/materials';

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

export default function NewConsumptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTaskId = Number(searchParams.get('taskId')) || 0;
  const fromTaskTitle = searchParams.get('taskTitle') ?? '';

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: tasks = [] } = useTasks();
  const { mutate: createConsumption, isPending } = useCreateConsumption();

  const [form, setForm] = useState({
    consumptionDate: new Date().toISOString().slice(0, 10),
    materialId: 0,
    quantity: '',
    consumptionType: ConsumptionType.usedFromStock,
    projectId: 0,
    storageLocationId: 0,
    taskId: fromTaskId,
    details: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current employee.');
      return;
    }
    if (!form.materialId) {
      toast.error('Material is required.');
      return;
    }
    if (!form.quantity || Number.parseInt(form.quantity, 10) <= 0) {
      toast.error('Quantity must be greater than 0.');
      return;
    }

    createConsumption(
      {
        consumptionDate: new Date(form.consumptionDate).toISOString(),
        materialId: form.materialId,
        quantity: Number.parseInt(form.quantity, 10),
        consumptionType: form.consumptionType,
        projectId: form.projectId || undefined,
        storageLocationId: form.storageLocationId || undefined,
        taskId: form.taskId || undefined,
        details: form.details.trim() || undefined,
        createdBy: currentEmployee.id,
      },
      {
        onSuccess: (consumption) => {
          if (fromTaskId) {
            router.back();
          } else {
            router.push(
              `/users/dashboard/resources/material-consumptions/${consumption.id}`
            );
          }
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Record Consumption
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Log material usage or transfer
        </p>
      </div>

      {/* Pre-filled from task banner */}
      {fromTaskId > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <ClipboardList className="h-4 w-4 flex-shrink-0" />
          <span>
            Recording consumption for task{' '}
            <span className="font-semibold">
              {fromTaskTitle || `#${fromTaskId}`}
            </span>
          </span>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Recording a consumption immediately decrements material stock. Verify
          the quantity before submitting.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) =>
                    setForm({ ...form, consumptionDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumptionType">
                  Consumption Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.consumptionType}
                  onValueChange={(v) =>
                    setForm({ ...form, consumptionType: v as ConsumptionType })
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
                  onValueChange={(v) =>
                    setForm({ ...form, materialId: Number(v) })
                  }
                >
                  <SelectTrigger id="materialId">
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
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  placeholder="0"
                  required
                />
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
                      setForm({ ...form, taskId: v === 'none' ? 0 : Number(v) })
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
                  onChange={(e) =>
                    setForm({ ...form, details: e.target.value })
                  }
                  placeholder="Additional notes about this consumption..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" type="button" asChild disabled={isPending}>
            <Link href="/users/dashboard/resources/material-consumptions">
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending || !currentEmployee}
            className="ml-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Record Consumption
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
