'use client';

import { use, useState } from 'react';
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
import { Save, Loader2 } from 'lucide-react';
import { useMaterial, useUpdateMaterial } from '@/hooks/materials';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { MaterialUnitSelector } from '@/features/materials/components/material-unit-selector';

export default function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: material, isLoading } = useMaterial(id);
  const { mutate: updateMaterial, isPending } = useUpdateMaterial();
  const { data: currentEmployee } = useCurrentUserEmployee();

  const [prevMaterial, setPrevMaterial] = useState(material);
  const [form, setForm] = useState({
    materialName: '',
    sku: '',
    unit: '',
    description: '',
    hsn: '',
    moq: '',
    minStock: '',
    maxStock: '',
    safteyStock: '',
    reorderLevel: '',
  });

  if (prevMaterial !== material && material) {
    setPrevMaterial(material);
    setForm({
      materialName: material.materialName,
      sku: material.sku ?? '',
      unit: material.unit,
      description: material.description ?? '',
      hsn: material.hsn ?? '',
      moq: material.moq === undefined ? '' : String(material.moq),
      minStock:
        material.minStock === undefined ? '' : String(material.minStock),
      maxStock:
        material.maxStock === undefined ? '' : String(material.maxStock),
      safteyStock:
        material.safetyStock === undefined ? '' : String(material.safetyStock),
      reorderLevel:
        material.reorderLevel === undefined
          ? ''
          : String(material.reorderLevel),
    });
  }

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.materialName.trim() || !form.unit.trim()) return;
    if (!currentEmployee?.id) return;

    updateMaterial(
      {
        id,
        material: {
          materialName: form.materialName.trim(),
          sku: form.sku.trim() || undefined,
          unit: form.unit.trim(),
          createdBy: currentEmployee.id,
          description: form.description.trim() || undefined,
          hsn: form.hsn.trim() || undefined,
          moq: form.moq === '' ? undefined : Number(form.moq),
          minStock: form.minStock === '' ? undefined : Number(form.minStock),
          maxStock: form.maxStock === '' ? undefined : Number(form.maxStock),
          safetyStock:
            form.safteyStock === '' ? undefined : Number(form.safteyStock),
          reorderLevel:
            form.reorderLevel === '' ? undefined : Number(form.reorderLevel),
        },
      },
      {
        onSuccess: () => {
          router.push(`/users/dashboard/resources/materials/${id}`);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }
  if (!material) {
    return (
      <div className="py-12 text-center text-zinc-500">Material not found.</div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Edit Material</h1>
        <p className="text-muted-foreground">
          Update details for {material.materialName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details of the material
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" disabled={isPending} asChild>
            <Link href={`/users/dashboard/resources/materials/${id}`}>
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={isPending} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
