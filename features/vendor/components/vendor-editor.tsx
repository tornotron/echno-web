'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
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
import { toast } from '@/lib/styles/toast-styles';
import { Building2, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { useUpdateVendor } from '@/hooks/vendors';
import {
  VendorType,
  VendorStatus,
  UpdateVendorRequest,
  VENDOR_TYPE_LABELS,
  VENDOR_STATUS_LABELS,
} from '@/types/vendor';
import type { Vendor } from '@/types/vendor';

interface VendorEditorProps {
  vendor: Vendor;
  vendorId: number;
}

export function VendorEditor({ vendor, vendorId }: VendorEditorProps) {
  const router = useRouter();
  const { mutate: updateVendor, isPending } = useUpdateVendor();

  const [form, setForm] = useState<UpdateVendorRequest>(() => ({
    name: vendor.name,
    email: vendor.email,
    address: vendor.address ?? '',
    website: vendor.website ?? '',
    city: vendor.city ?? '',
    state: vendor.state ?? '',
    pincode: vendor.pincode ?? '',
    country: vendor.country ?? '',
    type: vendor.type,
    status: vendor.status ?? VendorStatus.ACTIVE,
    notes: vendor.notes ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function set(field: keyof UpdateVendorRequest, value: string | undefined) {
    setForm((prev) => ({ ...prev, [field]: value || undefined }));
    clearError(field);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name?.trim()) newErrors.name = 'Company name is required';
    if (!form.email?.trim()) newErrors.email = 'Email is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }
    updateVendor(
      { id: vendorId, data: form },
      {
        onSuccess: () => {
          toast.success('Vendor updated successfully.');
          router.push(routes.thirdParty.vendors.detail(vendorId).href);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : 'Failed to update vendor.'
          ),
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Edit Vendor"
        description={`Update vendor information${form.name ? ` for ${form.name}` : ''}`}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>Basic vendor details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    clearError('name');
                  }}
                  placeholder="ABC Materials Pvt Ltd"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, email: e.target.value }));
                    clearError('email');
                  }}
                  placeholder="contact@abcmaterials.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website ?? ''}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://abcmaterials.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={form.address ?? ''}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="456, Industrial Area, Phase 2"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city ?? ''}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state ?? ''}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pin Code</Label>
                <Input
                  id="pincode"
                  value={form.pincode ?? ''}
                  onChange={(e) => set('pincode', e.target.value)}
                  placeholder="400001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country ?? ''}
                  onChange={(e) => set('country', e.target.value)}
                  placeholder="India"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Vendor type and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vendor Type</Label>
                <Select
                  value={form.type ?? ''}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      type: (v as VendorType) || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VendorType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {VENDOR_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status ?? VendorStatus.ACTIVE}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, status: v as VendorStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VendorStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {VENDOR_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes ?? ''}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(routes.thirdParty.vendors.detail(vendorId).href)
            }
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Saving...' : 'Update Vendor'}
          </Button>
        </div>
      </form>
    </div>
  );
}
