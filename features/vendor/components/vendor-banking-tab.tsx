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
import { Switch } from '@/components/shadcn/switch';
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
import { CreditCard, Edit, Landmark, Plus, Star, Trash2 } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  useVendorBankAccounts,
  useAddVendorBankAccount,
  useUpdateVendorBankAccount,
  useDeleteVendorBankAccount,
} from '@/hooks/vendors';
import type {
  VendorBankAccount,
  CreateVendorBankAccountRequest,
} from '@/types/vendor';

interface VendorBankingTabProps {
  vendorId: number;
}

export function VendorBankingTab({ vendorId }: VendorBankingTabProps) {
  const { data: bankAccounts = [] } = useVendorBankAccounts(vendorId);
  const addBank = useAddVendorBankAccount(vendorId);
  const updateBank = useUpdateVendorBankAccount(vendorId);
  const removeBank = useDeleteVendorBankAccount(vendorId);

  const [dialog, setDialog] = useState<{
    open: boolean;
    editing?: VendorBankAccount;
  }>({ open: false });
  const [form, setForm] = useState<CreateVendorBankAccountRequest>({});
  const [toDelete, setToDelete] = useState<VendorBankAccount | null>(null);

  function openAdd() {
    setForm({});
    setDialog({ open: true });
  }

  function openEdit(b: VendorBankAccount) {
    setForm({
      bankName: b.bankName,
      accountNumber: b.accountNumber,
      ifscCode: b.ifscCode,
      accountHolderName: b.accountHolderName,
      swift: b.swift,
      default: b.default,
    });
    setDialog({ open: true, editing: b });
  }

  function submit() {
    if (addBank.isPending || updateBank.isPending) return;
    const onSuccess = () => {
      toast.success(
        dialog.editing ? 'Bank account updated.' : 'Bank account added.'
      );
      setDialog({ open: false });
    };
    const mutateOptions = { onSuccess };
    if (dialog.editing) {
      updateBank.mutate(
        { accountId: dialog.editing.id, bankAccountInput: form },
        mutateOptions
      );
    } else {
      addBank.mutate(form, mutateOptions);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" /> Bank Accounts
          </CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <Landmark className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No bank accounts yet</EmptyTitle>
                <EmptyDescription>
                  Add a bank account for this vendor.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {b.bankName ?? 'Unknown Bank'}
                      </p>
                      {b.default && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Star className="mr-1 h-3 w-3" /> Default
                        </Badge>
                      )}
                    </div>
                    {b.accountHolderName && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {b.accountHolderName}
                      </p>
                    )}
                    {b.accountNumber && (
                      <p className="flex items-center gap-1 text-sm text-zinc-500">
                        <CreditCard className="h-3 w-3" />
                        ••••
                        {b.accountNumber.length > 4
                          ? b.accountNumber.slice(-4)
                          : '••••'}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-zinc-400">
                      {b.ifscCode && <span>IFSC: {b.ifscCode}</span>}
                      {b.swift && <span>SWIFT: {b.swift}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(b)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setToDelete(b)}
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
              {dialog.editing ? 'Edit Bank Account' : 'Add Bank Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Bank Name</Label>
              <Input
                value={form.bankName ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    bankName: e.target.value || undefined,
                  }))
                }
                placeholder="HDFC Bank"
              />
            </div>
            <div className="col-span-2">
              <Label>Account Holder Name</Label>
              <Input
                value={form.accountHolderName ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    accountHolderName: e.target.value || undefined,
                  }))
                }
                placeholder="Acme Supplies Pvt Ltd"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={form.accountNumber ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    accountNumber: e.target.value || undefined,
                  }))
                }
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>IFSC Code</Label>
              <Input
                value={form.ifscCode ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    ifscCode: e.target.value || undefined,
                  }))
                }
                placeholder="HDFC0001234"
              />
            </div>
            <div className="col-span-2">
              <Label>
                SWIFT Code{' '}
                <span className="text-xs text-zinc-400">(optional)</span>
              </Label>
              <Input
                value={form.swift ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, swift: e.target.value || undefined }))
                }
                placeholder="HDFCINBB"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <div>
                <p className="text-sm font-medium">Default Account</p>
                <p className="text-xs text-zinc-500">
                  Use this account for payments by default
                </p>
              </div>
              <Switch
                checked={form.default ?? false}
                onCheckedChange={(v) => setForm((p) => ({ ...p, default: v }))}
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
              disabled={addBank.isPending || updateBank.isPending}
            >
              {addBank.isPending || updateBank.isPending ? 'Saving...' : 'Save'}
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
            <AlertDialogTitle>Remove bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {toDelete?.bankName} ending in ••••
              {toDelete?.accountNumber?.slice(-4)} from this vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!toDelete) return;
                removeBank.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success('Bank account removed.');
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
