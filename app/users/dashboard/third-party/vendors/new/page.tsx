'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { toast } from 'sonner';
import { Building2, Save, X } from 'lucide-react';
import { useCreateVendor } from '@/hooks/vendors';
import {
  VendorType,
  VendorStatus,
  CreateVendorInput,
  VENDOR_TYPE_LABELS,
  VENDOR_STATUS_LABELS,
} from '@/types/vendor';

const INITIAL: CreateVendorInput = {
  name: '',
  email: '',
  address: '',
  website: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
  type: undefined,
  status: VendorStatus.ACTIVE,
  notes: '',
};

export default function VendorNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateVendorInput>(INITIAL);
  const { mutate: createVendor, isPending } = useCreateVendor();

  function set(field: keyof CreateVendorInput, value: string | undefined) {
    setForm((prev) => ({ ...prev, [field]: value || undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Company name and email are required.');
      return;
    }
    createVendor(form, {
      onSuccess: () => {
        toast.success('Vendor created successfully.');
        router.push('/users/dashboard/third-party/vendors');
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'Failed to create vendor.'
        ),
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Add New Vendor
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Fill in the basic details to add a new vendor
        </p>
      </div>

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
              <div>
                <Label htmlFor="name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="ABC Materials Pvt Ltd"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="contact@abcmaterials.com"
                  required
                />
              </div>
              <div>
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
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city ?? ''}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state ?? ''}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pin Code</Label>
                <Input
                  id="pincode"
                  value={form.pincode ?? ''}
                  onChange={(e) => set('pincode', e.target.value)}
                  placeholder="400001"
                />
              </div>
              <div>
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
              <div>
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
              <div>
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
            onClick={() => router.push('/users/dashboard/third-party/vendors')}
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Creating...' : 'Create Vendor'}
          </Button>
        </div>
      </form>
    </div>
  );
}
