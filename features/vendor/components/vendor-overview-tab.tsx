'use client';

import { useState } from 'react';
import { toast } from '@/lib/styles/toast-styles';
import { Button } from '@/components/shadcn/button';
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
import { Badge } from '@/components/shadcn/badge';
import {
  Building2,
  DollarSign,
  Edit,
  Globe,
  Mail,
  MapPin,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import {
  useVendorPaymentTerms,
  useSetVendorPaymentTerms,
  useDeleteVendorPaymentTerms,
} from '@/hooks/vendors';
import {
  PaymentTerms,
  SetVendorPaymentTermsRequest,
  PAYMENT_TERMS_LABELS,
  getVendorTypeLabel,
} from '@/types/vendor';
import type { Vendor, VendorPaymentTermsDetails } from '@/types/vendor';
import { VendorStatusBadge } from './vendor-status-badge';
import { VendorField } from './vendor-field';

interface VendorOverviewTabProps {
  vendorId: number;
  vendor: Vendor;
}

export function VendorOverviewTab({
  vendorId,
  vendor,
}: VendorOverviewTabProps) {
  const { data: paymentTerms } = useVendorPaymentTerms(vendorId);
  const setPaymentTermsMutation = useSetVendorPaymentTerms(vendorId);
  const removePaymentTermsMutation = useDeleteVendorPaymentTerms(vendorId);

  const [ptDialog, setPtDialog] = useState(false);
  const [ptForm, setPtForm] = useState<SetVendorPaymentTermsRequest>({
    paymentTerms: '',
  });
  const [deletePt, setDeletePt] = useState(false);

  function openSetPaymentTerms(existing?: VendorPaymentTermsDetails) {
    setPtForm({
      paymentTerms: existing?.paymentTerms ?? '',
      creditLimit: existing?.creditLimit,
      creditDays: existing?.creditDays,
    });
    setPtDialog(true);
  }

  function submitPaymentTerms() {
    if (!ptForm.paymentTerms) {
      toast.error('Payment terms is required.');
      return;
    }
    setPaymentTermsMutation.mutate(ptForm, {
      onSuccess: () => {
        toast.success('Payment terms saved.');
        setPtDialog(false);
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'Failed to save payment terms.'
        ),
    });
  }

  const locationParts = [
    vendor.city,
    vendor.state,
    vendor.pincode,
    vendor.country,
  ].filter(Boolean);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {vendor.type && (
                  <VendorField
                    label="Vendor Type"
                    value={
                      <Badge variant="outline">
                        {getVendorTypeLabel(vendor.type)}
                      </Badge>
                    }
                  />
                )}
                <VendorField
                  label="Status"
                  value={<VendorStatusBadge status={vendor.status} />}
                />
                {vendor.contactPerson && (
                  <VendorField
                    label="Primary Contact"
                    value={vendor.contactPerson}
                  />
                )}
                {vendor.phone && (
                  <VendorField
                    label="Phone"
                    value={<PhoneDisplay value={vendor.phone} asLink />}
                  />
                )}
                <VendorField
                  label="Email"
                  value={
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      {vendor.email}
                    </span>
                  }
                />
                {vendor.website && (
                  <VendorField
                    label="Website"
                    value={
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {vendor.website}
                      </a>
                    }
                  />
                )}
                {vendor.address && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />
                      Address
                    </p>
                    <p className="mt-1 text-base">{vendor.address}</p>
                    {locationParts.length > 0 && (
                      <p className="text-sm text-zinc-500">
                        {locationParts.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <VendorField
                  label="Total Purchase"
                  value={
                    <span className="text-xl font-bold">
                      {vendor.totalPurchaseValue
                        ? `₹${(vendor.totalPurchaseValue / 100_000).toFixed(2)}L`
                        : '—'}
                    </span>
                  }
                />
                <VendorField
                  label="Outstanding"
                  value={
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {vendor.totalOutstanding
                        ? `₹${(vendor.totalOutstanding / 1000).toFixed(0)}K`
                        : '—'}
                    </span>
                  }
                />
                <VendorField
                  label="Total Orders"
                  value={
                    <span className="text-xl font-bold">
                      {vendor.totalOrders ?? 0}
                    </span>
                  }
                />
                <VendorField
                  label="Pending Orders"
                  value={
                    <span className="text-xl font-bold">
                      {vendor.pendingOrders ?? 0}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Terms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4" /> Payment Terms
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openSetPaymentTerms(paymentTerms ?? undefined)}
              >
                {paymentTerms ? (
                  <Edit className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentTerms ? (
                <>
                  <VendorField
                    label="Terms"
                    value={
                      PAYMENT_TERMS_LABELS[
                        paymentTerms.paymentTerms as PaymentTerms
                      ] ?? paymentTerms.paymentTerms
                    }
                  />
                  {paymentTerms.creditLimit !== undefined && (
                    <VendorField
                      label="Credit Limit"
                      value={
                        paymentTerms.creditLimit === 0
                          ? 'No limit'
                          : `₹${paymentTerms.creditLimit.toLocaleString()}`
                      }
                    />
                  )}
                  {paymentTerms.creditDays !== undefined && (
                    <VendorField
                      label="Credit Days"
                      value={
                        paymentTerms.creditDays === 0
                          ? 'Immediate payment'
                          : `${paymentTerms.creditDays} days`
                      }
                    />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-red-500 hover:text-red-600"
                    onClick={() => setDeletePt(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                </>
              ) : (
                <p className="text-sm text-zinc-400">
                  No payment terms set.{' '}
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => openSetPaymentTerms()}
                  >
                    Set now
                  </button>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {vendor.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {vendor.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Terms Dialog */}
      <Dialog open={ptDialog} onOpenChange={setPtDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentTerms ? 'Update Payment Terms' : 'Set Payment Terms'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Payment Terms <span className="text-red-500">*</span>
              </Label>
              <Select
                value={ptForm.paymentTerms}
                onValueChange={(v) =>
                  setPtForm((p) => ({ ...p, paymentTerms: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentTerms).map((t) => (
                    <SelectItem key={t} value={t}>
                      {PAYMENT_TERMS_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Credit Limit (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ptForm.creditLimit ?? ''}
                  onChange={(e) =>
                    setPtForm((p) => ({
                      ...p,
                      creditLimit: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="500000"
                />
              </div>
              <div>
                <Label>Credit Days</Label>
                <Input
                  type="number"
                  min={0}
                  value={ptForm.creditDays ?? ''}
                  onChange={(e) =>
                    setPtForm((p) => ({
                      ...p,
                      creditDays: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="30"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPtDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitPaymentTerms}
              disabled={setPaymentTermsMutation.isPending}
            >
              {setPaymentTermsMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Terms Confirm */}
      <AlertDialog open={deletePt} onOpenChange={setDeletePt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment terms?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the payment terms configuration for this vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                removePaymentTermsMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('Payment terms removed.');
                    setDeletePt(false);
                  },
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : 'Failed.'),
                })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
