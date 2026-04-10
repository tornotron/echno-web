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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Package, Send, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useMaterials } from '@/hooks/materials';
import { useCreateIndent, useIndents } from '@/hooks/indents';
import { useProjects } from '@/hooks/project/use-projects';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { IndentStatus, indentStatusLabels } from '@/types/indents';
import { generateIndentNumber } from '@/lib/utils/document-number-utils';

interface ItemRow {
  materialId: number;
  requestedQuantity: number;
  additionalSpecifications: string;
  remarks: string;
}

export default function NewIndentPage() {
  const router = useRouter();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const { data: existingIndents = [] } = useIndents();
  const { mutateAsync: createIndent, isPending } = useCreateIndent();

  const [prevExistingIndents, setPrevExistingIndents] =
    useState(existingIndents);
  const [form, setForm] = useState({
    indentNumber: generateIndentNumber(
      existingIndents.map((i) => i.indentNumber)
    ),
    status: IndentStatus.pending,
    expectedOn: '',
    remarks: '',
    projectId: '',
  });

  if (prevExistingIndents !== existingIndents && existingIndents.length > 0) {
    setPrevExistingIndents(existingIndents);
    setForm((prev) => ({
      ...prev,
      indentNumber: generateIndentNumber(
        existingIndents.map((i) => i.indentNumber)
      ),
    }));
  }
  const [items, setItems] = useState<ItemRow[]>([
    {
      materialId: 0,
      requestedQuantity: 1,
      additionalSpecifications: '',
      remarks: '',
    },
  ]);

  function addItem() {
    setItems([
      ...items,
      {
        materialId: 0,
        requestedQuantity: 1,
        additionalSpecifications: '',
        remarks: '',
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      toast.error('At least one item is required.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.indentNumber.trim()) {
      toast.error('Indent number is required.');
      return;
    }
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current user.');
      return;
    }
    const filledItems = items.filter((it) => it.materialId !== 0);
    if (filledItems.length === 0) {
      toast.error('At least one material must be selected.');
      return;
    }
    const hasInvalidItems = filledItems.some((it) => it.requestedQuantity <= 0);
    if (hasInvalidItems) {
      toast.error('All added items must have a quantity greater than 0.');
      return;
    }

    try {
      const indent = await createIndent({
        indentNumber: form.indentNumber.trim(),
        createdByEmployeeId: currentEmployee.id,
        status: form.status,
        expectedOn: form.expectedOn
          ? new Date(form.expectedOn).toISOString()
          : undefined,
        remarks: form.remarks.trim() || undefined,
        projectId: form.projectId ? Number(form.projectId) : undefined,
        items: filledItems.map((item) => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
          additionalSpecifications:
            item.additionalSpecifications.trim() || undefined,
          remarks: item.remarks.trim() || undefined,
        })),
      });

      router.push(`/users/dashboard/resources/indents/${indent.id}`);
    } catch {
      // errors handled by mutation hook
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Create New Indent
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Submit a material indent request
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indent Details Card */}
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
                  onChange={(e) =>
                    setForm({ ...form, indentNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as IndentStatus })
                  }
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
                  onValueChange={(v) => setForm({ ...form, projectId: v })}
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
                  onChange={(e) =>
                    setForm({ ...form, expectedOn: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
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
                  {items.map((item, index) => (
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
                          className="w-full"
                        />
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" type="button" asChild disabled={isPending}>
            <Link href="/users/dashboard/resources/indents">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="ml-auto">
            <Send className="mr-2 h-4 w-4" />
            {isPending ? 'Creating...' : 'Create Indent'}
          </Button>
        </div>
      </form>
    </div>
  );
}
