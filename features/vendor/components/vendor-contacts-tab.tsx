'use client';

import { useState } from 'react';
import { toast } from '@/lib/styles/toast-styles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Mail, Phone, Plus, Star, Trash2 } from 'lucide-react';
import {
  useVendorContacts,
  useAddVendorContact,
  useUpdateVendorContact,
  useDeleteVendorContact,
} from '@/hooks/vendors';
import type { VendorContact, CreateVendorContactInput } from '@/types/vendor';

interface VendorContactsTabProps {
  vendorId: number;
}

export function VendorContactsTab({ vendorId }: VendorContactsTabProps) {
  const { data: contacts = [] } = useVendorContacts(vendorId);
  const addContact = useAddVendorContact(vendorId);
  const updateContact = useUpdateVendorContact(vendorId);
  const removeContact = useDeleteVendorContact(vendorId);

  const [dialog, setDialog] = useState<{
    open: boolean;
    editing?: VendorContact;
  }>({ open: false });
  const [form, setForm] = useState<CreateVendorContactInput>({});
  const [toDelete, setToDelete] = useState<VendorContact | null>(null);

  function openAdd() {
    setForm({});
    setDialog({ open: true });
  }

  function openEdit(c: VendorContact) {
    setForm({
      contactPerson: c.contactPerson,
      email: c.email,
      phone: c.phone,
      alternatePhone: c.alternatePhone,
      primary: c.primary,
    });
    setDialog({ open: true, editing: c });
  }

  function submit() {
    if (addContact.isPending || updateContact.isPending) return;
    if (!form.contactPerson?.trim() && !form.email?.trim()) {
      toast.error('At least a contact person or email is required.');
      return;
    }
    const onSuccess = () => {
      toast.success(dialog.editing ? 'Contact updated.' : 'Contact added.');
      setDialog({ open: false });
    };
    const mutateOptions = { onSuccess };
    if (dialog.editing) {
      updateContact.mutate(
        { contactId: dialog.editing.id, contactInput: form },
        mutateOptions
      );
    } else {
      addContact.mutate(form, mutateOptions);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Contacts
          </CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              No contacts yet. Add a contact person for this vendor.
            </p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {c.contactPerson ?? 'Unnamed'}
                      </p>
                      {c.primary && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Star className="mr-1 h-3 w-3" /> Primary
                        </Badge>
                      )}
                    </div>
                    {c.email && (
                      <p className="flex items-center gap-1 text-sm text-zinc-500">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </p>
                    )}
                    {c.phone && (
                      <p className="flex items-center gap-1 text-sm text-zinc-500">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                        {c.alternatePhone && ` / ${c.alternatePhone}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(c)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setToDelete(c)}
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
              {dialog.editing ? 'Edit Contact' : 'Add Contact'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    contactPerson: e.target.value || undefined,
                  }))
                }
                placeholder="Rajesh Kumar"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value || undefined }))
                }
                placeholder="rajesh@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value || undefined }))
                }
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="col-span-2">
              <Label>Alternate Phone</Label>
              <Input
                type="tel"
                value={form.alternatePhone ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    alternatePhone: e.target.value || undefined,
                  }))
                }
                placeholder="+91 98765 43211"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <div>
                <p className="text-sm font-medium">Primary Contact</p>
                <p className="text-xs text-zinc-500">
                  Mark as the main point of contact
                </p>
              </div>
              <Switch
                checked={form.primary ?? false}
                onCheckedChange={(v) => setForm((p) => ({ ...p, primary: v }))}
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
              disabled={addContact.isPending || updateContact.isPending}
            >
              {addContact.isPending || updateContact.isPending
                ? 'Saving...'
                : 'Save'}
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
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {toDelete?.contactPerson ?? 'this contact'} from the
              vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!toDelete) return;
                removeContact.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success('Contact removed.');
                    setToDelete(null);
                  },
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
