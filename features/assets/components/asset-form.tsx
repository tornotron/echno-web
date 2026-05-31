'use client';

import { useState, useEffect } from 'react';
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
import {
  Asset,
  AssetType,
  AssetStatus,
  AssetCondition,
  assetTypeLabels,
  assetStatusLabels,
  assetConditionLabels,
} from '@/types/resource';
import { useStorageLocations } from '@/hooks/storage-locations';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';
import { format, isValid } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetFormData {
  name: string;
  description: string;
  type: AssetType | '';
  category: string;
  status: AssetStatus;
  condition: AssetCondition;
  locationId: string;
  assignedTo: string;
  assignedProject: string;
  purchaseDate: string;
  purchasePrice: string;
  depreciationRate: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  registrationNumber: string;
  warrantyExpiry: string;
  maintenanceSchedule: string;
  usageHours: string;
  maxUsageHours: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  fuelType: string;
  insuranceProvider: string;
  policyNumber: string;
  insuranceExpiry: string;
  notes: string;
}

const EMPTY_FORM: AssetFormData = {
  name: '',
  description: '',
  type: '',
  category: '',
  status: 'available',
  condition: 'good',
  locationId: '',
  assignedTo: '',
  assignedProject: '',
  purchaseDate: '',
  purchasePrice: '',
  depreciationRate: '10',
  manufacturer: '',
  model: '',
  serialNumber: '',
  registrationNumber: '',
  warrantyExpiry: '',
  maintenanceSchedule: '',
  usageHours: '',
  maxUsageHours: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  fuelType: '',
  insuranceProvider: '',
  policyNumber: '',
  insuranceExpiry: '',
  notes: '',
};

interface CreateProps {
  mode: 'create';
  onSubmit: (data: AssetFormData) => void;
}

interface EditProps {
  mode: 'edit';
  asset: Asset;
  onSubmit: (data: AssetFormData) => void;
}

type AssetFormProps = CreateProps | EditProps;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ASSET_FORM_ID = 'asset-form';

const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'CNG', 'Hybrid', 'N/A'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssetForm(props: AssetFormProps) {
  const { mode } = props;
  const isEdit = mode === 'edit';

  const { data: locations = [] } = useStorageLocations();
  const [form, setForm] = useState<AssetFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from asset data in edit mode
  useEffect(() => {
    if (!isEdit) return;
    const a = (props as EditProps).asset;
    setForm({
      name: a.name,
      description: a.description ?? '',
      type: a.type,
      category: a.category ?? '',
      status: a.status,
      condition: a.condition,
      locationId: String(a.locationId),
      assignedTo: a.assignedTo ?? '',
      assignedProject: a.assignedProject ?? '',
      purchaseDate: isValid(a.purchaseDate)
        ? format(a.purchaseDate, 'yyyy-MM-dd')
        : '',
      purchasePrice: String(a.purchasePrice),
      depreciationRate: String(a.depreciationRate ?? 10),
      manufacturer: a.manufacturer ?? '',
      model: a.model ?? '',
      serialNumber: a.serialNumber ?? '',
      registrationNumber: a.registrationNumber ?? '',
      warrantyExpiry: a.warrantyExpiry
        ? format(a.warrantyExpiry, 'yyyy-MM-dd')
        : '',
      maintenanceSchedule: a.maintenanceSchedule ?? '',
      usageHours: a.usageHours === undefined ? '' : String(a.usageHours),
      maxUsageHours:
        a.maxUsageHours === undefined ? '' : String(a.maxUsageHours),
      lastMaintenanceDate: a.lastMaintenanceDate
        ? format(a.lastMaintenanceDate, 'yyyy-MM-dd')
        : '',
      nextMaintenanceDate: a.nextMaintenanceDate
        ? format(a.nextMaintenanceDate, 'yyyy-MM-dd')
        : '',
      fuelType: a.fuelType ?? '',
      insuranceProvider: a.insuranceProvider ?? '',
      policyNumber: a.policyNumber ?? '',
      insuranceExpiry: a.insuranceExpiry
        ? format(a.insuranceExpiry, 'yyyy-MM-dd')
        : '',
      notes: a.notes ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(props as EditProps).asset]);

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function set(field: keyof AssetFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    const nameError = required('Asset name')(form.name);
    if (nameError) newErrors.name = nameError;

    const typeError = required('Asset type')(form.type);
    if (typeError) newErrors.type = typeError;

    const locationError = required('Location')(form.locationId);
    if (locationError) newErrors.locationId = locationError;

    const purchaseDateError = required('Purchase date')(form.purchaseDate);
    if (purchaseDateError) newErrors.purchaseDate = purchaseDateError;

    const purchasePriceError = required('Purchase price')(form.purchasePrice);
    if (purchasePriceError) newErrors.purchasePrice = purchasePriceError;
    else if (Number(form.purchasePrice) < 0)
      newErrors.purchasePrice = 'Purchase price must be a positive number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form',
      });
      return;
    }
    props.onSubmit(form);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form id={ASSET_FORM_ID} onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main — 2 cols */}
        <div className="space-y-6 md:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the basic details of the asset'
                  : 'Enter the basic details of the asset'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">
                    Asset Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Excavator CAT 320D"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter asset description..."
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">
                    Asset Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => set('type', v)}
                  >
                    <SelectTrigger
                      id="type"
                      className={errors.type ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(assetTypeLabels) as [AssetType, string][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Excavators"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Caterpillar"
                    value={form.manufacturer}
                    onChange={(e) => set('manufacturer', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., 320D"
                    value={form.model}
                    onChange={(e) => set('model', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g., CAT320D2024001"
                    value={form.serialNumber}
                    onChange={(e) => set('serialNumber', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Registration Number
                  </Label>
                  <Input
                    id="registrationNumber"
                    placeholder="e.g., KA-01-EQ-1234"
                    value={form.registrationNumber}
                    onChange={(e) => set('registrationNumber', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase & Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase & Financial Details</CardTitle>
              <CardDescription>
                Asset purchase and valuation information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">
                    Purchase Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => set('purchaseDate', e.target.value)}
                    className={errors.purchaseDate ? 'border-red-500' : ''}
                  />
                  {errors.purchaseDate && (
                    <p className="text-sm text-red-500">
                      {errors.purchaseDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">
                    Purchase Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    placeholder="e.g., 8500000"
                    value={form.purchasePrice}
                    onChange={(e) => set('purchasePrice', e.target.value)}
                    className={errors.purchasePrice ? 'border-red-500' : ''}
                  />
                  {errors.purchasePrice && (
                    <p className="text-sm text-red-500">
                      {errors.purchasePrice}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depreciationRate">
                    Depreciation Rate (%)
                  </Label>
                  <Input
                    id="depreciationRate"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g., 10"
                    value={form.depreciationRate}
                    onChange={(e) => set('depreciationRate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={(e) => set('warrantyExpiry', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Details */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Details</CardTitle>
              <CardDescription>
                Usage and maintenance information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="usageHours">Current Usage Hours</Label>
                    <Input
                      id="usageHours"
                      type="number"
                      min="0"
                      placeholder="e.g., 4200"
                      value={form.usageHours}
                      onChange={(e) => set('usageHours', e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="maxUsageHours">Max Usage Hours</Label>
                  <Input
                    id="maxUsageHours"
                    type="number"
                    min="0"
                    placeholder="e.g., 15000"
                    value={form.maxUsageHours}
                    onChange={(e) => set('maxUsageHours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select
                    value={form.fuelType || 'none'}
                    onValueChange={(v) =>
                      set('fuelType', v === 'none' ? '' : v)
                    }
                  >
                    <SelectTrigger id="fuelType">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {FUEL_TYPES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f === 'N/A' ? 'Not Applicable' : f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="maintenanceSchedule">
                    Maintenance Schedule
                  </Label>
                  <Input
                    id="maintenanceSchedule"
                    placeholder="e.g., Every 500 hours"
                    value={form.maintenanceSchedule}
                    onChange={(e) => set('maintenanceSchedule', e.target.value)}
                  />
                </div>

                {isEdit && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="lastMaintenanceDate">
                        Last Maintenance Date
                      </Label>
                      <Input
                        id="lastMaintenanceDate"
                        type="date"
                        value={form.lastMaintenanceDate}
                        onChange={(e) =>
                          set('lastMaintenanceDate', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nextMaintenanceDate">
                        Next Maintenance Date
                      </Label>
                      <Input
                        id="nextMaintenanceDate"
                        type="date"
                        value={form.nextMaintenanceDate}
                        onChange={(e) =>
                          set('nextMaintenanceDate', e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Insurance */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
              <CardDescription>Asset insurance details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input
                    id="insuranceProvider"
                    placeholder="e.g., HDFC Ergo"
                    value={form.insuranceProvider}
                    onChange={(e) => set('insuranceProvider', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    placeholder="e.g., HDFC-EQ-2024-001"
                    value={form.policyNumber}
                    onChange={(e) => set('policyNumber', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={form.insuranceExpiry}
                    onChange={(e) => set('insuranceExpiry', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or comments..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status & Location */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set('status', v as AssetStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(assetStatusLabels) as [
                        AssetStatus,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">
                  Condition <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => set('condition', v as AssetCondition)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(assetConditionLabels) as [
                        AssetCondition,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.locationId || 'none'}
                  onValueChange={(v) =>
                    set('locationId', v === 'none' ? '' : v)
                  }
                >
                  <SelectTrigger
                    id="locationId"
                    className={errors.locationId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select location</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.locationId && (
                  <p className="text-sm text-red-500">{errors.locationId}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="e.g., John Doe"
                  value={form.assignedTo}
                  onChange={(e) => set('assignedTo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedProject">Assigned Project</Label>
                <Input
                  id="assignedProject"
                  placeholder="e.g., Metro Line Extension"
                  value={form.assignedProject}
                  onChange={(e) => set('assignedProject', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
