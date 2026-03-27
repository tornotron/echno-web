'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Info } from 'lucide-react';
import { useCreateMaterial } from '@/hooks/materials';
import { useStorageLocations } from '@/hooks/storage-locations/use-storage-locations';
import { useProjects } from '@/hooks/project/use-projects';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { MaterialUnitSelector } from '@/features/materials/components/material-unit-selector';

export default function NewMaterialPage() {
  const router = useRouter();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: storageLocations = [] } = useStorageLocations();
  const { data: projects = [] } = useProjects();
  const { mutate: createMaterial, isPending } = useCreateMaterial();

  const [form, setForm] = useState({
    materialName: '',
    sku: '',
    unit: '',
    description: '',
    hsn: '',
    openingStock: '',
    unitCost: '',
    storageLocationId: '',
    projectId: '',
    moq: '',
    minStock: '',
    maxStock: '',
    safteyStock: '',
    reorderLevel: '',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const hasOpeningStock =
    form.openingStock !== '' && Number(form.openingStock) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.materialName.trim() || !form.unit.trim()) return;
    if (hasOpeningStock && form.unitCost === '') return;

    const createdBy = currentEmployee?.id;
    if (!createdBy) return;

    createMaterial(
      {
        materialName: form.materialName.trim(),
        sku: form.sku.trim() || undefined,
        unit: form.unit.trim(),
        createdBy,
        description: form.description.trim() || undefined,
        hsn: form.hsn.trim() || undefined,
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
          form.safteyStock === '' ? undefined : Number(form.safteyStock),
        reorderLevel:
          form.reorderLevel === '' ? undefined : Number(form.reorderLevel),
      },
      {
        onSuccess: (material) => {
          router.push(`/users/dashboard/resources/materials/${material.id}`);
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Add Material</h1>
        <p className="text-muted-foreground">Create a new material record</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left — main content (2 cols) */}
          <div className="space-y-6 md:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details of the material
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
                      required
                    />
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
                      required
                    />
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
                      onChange={(e) => set('moq', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={form.minStock}
                      onChange={(e) => set('minStock', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Max Stock</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={form.maxStock}
                      onChange={(e) => set('maxStock', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="safteyStock">Safety Stock</Label>
                    <Input
                      id="safteyStock"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={form.safteyStock}
                      onChange={(e) => set('safteyStock', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={form.reorderLevel}
                      onChange={(e) => set('reorderLevel', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Stock & Location */}
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
                      set('openingStock', e.target.value);
                      // Clear location/project if stock is removed
                      if (!e.target.value || Number(e.target.value) <= 0) {
                        setForm((prev) => ({
                          ...prev,
                          openingStock: e.target.value,
                          unitCost: '',
                          storageLocationId: '',
                          projectId: '',
                        }));
                      }
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
                        required
                      />
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
        </div>

        {/* Action Buttons — task page style */}
        <div className="flex gap-3">
          <Link href="/users/dashboard/resources/materials">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Saving...' : 'Create Material'}
          </Button>
        </div>
      </form>
    </div>
  );
}
