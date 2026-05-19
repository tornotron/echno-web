'use client';

import { useState } from 'react';
import { toast } from '@/lib/styles/toast-styles';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Edit, FileText, Plus, Trash2 } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  useVendorTaxIdentifiers,
  useAddVendorTaxIdentifier,
  useUpdateVendorTaxIdentifier,
  useDeleteVendorTaxIdentifier,
} from '@/hooks/vendors';
import type {
  VendorTaxIdentifier,
  CreateVendorTaxIdentifierInput,
} from '@/types/vendor';

const TAX_ID_TYPES = ['GST', 'PAN', 'TAN', 'TIN', 'CIN', 'OTHER'];

interface VendorTaxTabProps {
  vendorId: number;
}

export function VendorTaxTab({ vendorId }: VendorTaxTabProps) {
  const { data: taxIdentifiers = [] } = useVendorTaxIdentifiers(vendorId);
  const addTax = useAddVendorTaxIdentifier(vendorId);
  const updateTax = useUpdateVendorTaxIdentifier(vendorId);
  const removeTax = useDeleteVendorTaxIdentifier(vendorId);

  const [dialog, setDialog] = useState<{
    open: boolean;
    editing?: VendorTaxIdentifier;
  }>({ open: false });
  const [form, setForm] = useState<CreateVendorTaxIdentifierInput>({
    type: 'GST',
    value: '',
  });
  const [toDelete, setToDelete] = useState<VendorTaxIdentifier | null>(null);

  function openAdd() {
    setForm({ type: 'GST', value: '' });
    setDialog({ open: true });
  }

  function openEdit(t: VendorTaxIdentifier) {
    setForm({ type: t.type, value: t.value });
    setDialog({ open: true, editing: t });
  }

  function submit() {
    if (!form.value.trim()) {
      toast.error('Value is required.');
      return;
    }
    if (addTax.isPending || updateTax.isPending) return;
    const onSuccess = () => {
      toast.success(dialog.editing ? 'Tax ID updated.' : 'Tax ID added.');
      setDialog({ open: false });
    };
    const mutateOptions = { onSuccess };
    if (dialog.editing) {
      updateTax.mutate(
        { taxIdId: dialog.editing.id, taxIdentifierInput: form },
        mutateOptions
      );
    } else {
      addTax.mutate(form, mutateOptions);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Tax Identifiers
          </CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {taxIdentifiers.length === 0 ? (
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <FileText className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No tax identifiers yet</EmptyTitle>
                <EmptyDescription>
                  Add a GST, PAN, or other tax identifier.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              {taxIdentifiers.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="shrink-0">
                      {t.type}
                    </Badge>
                    <span className="font-mono text-sm">{t.value}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(t)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setToDelete(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.editing ? 'Edit Tax Identifier' : 'Add Tax Identifier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_ID_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number / Value</Label>
              <Input
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                placeholder={
                  form.type === 'GST'
                    ? '27AABCU9603R1ZX'
                    : form.type === 'PAN'
                      ? 'AABCU9603R'
                      : ''
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={addTax.isPending || updateTax.isPending}
            >
              {addTax.isPending || updateTax.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove tax identifier?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {toDelete?.type} {toDelete?.value} from this vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!toDelete) return;
                removeTax.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success('Tax identifier removed.');
                    setToDelete(null);
                  },
                });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
