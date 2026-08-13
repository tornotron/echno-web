'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  TextField,
  SelectField,
  TextareaField,
  DateField,
  type SelectOption,
} from '@/components/common/form';
import {
  Asset,
  AssetType,
  AssetStatus,
  AssetCondition,
  assetTypeLabels,
  assetStatusLabels,
  assetConditionLabels,
} from '@/types/resource';
import { useStorageLocations } from '@tornotron/echno-core/storage-locations/hooks';
import { required } from '@/lib/validators';
import { useEntityForm, type FormErrors } from '@/hooks/use-entity-form';
import { format, isValid } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssetFormData = {
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
};

function assetToForm(a: Asset): AssetFormData {
  return {
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
    maxUsageHours: a.maxUsageHours === undefined ? '' : String(a.maxUsageHours),
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
  };
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

const typeOptions: SelectOption[] = (
  Object.entries(assetTypeLabels) as [AssetType, string][]
).map(([value, label]) => ({ value, label }));

const statusOptions: SelectOption[] = (
  Object.entries(assetStatusLabels) as [AssetStatus, string][]
).map(([value, label]) => ({ value, label }));

const conditionOptions: SelectOption[] = (
  Object.entries(assetConditionLabels) as [AssetCondition, string][]
).map(([value, label]) => ({ value, label }));

const fuelOptions: SelectOption[] = FUEL_TYPES.map((f) => ({
  value: f,
  label: f === 'N/A' ? 'Not Applicable' : f,
}));

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateAsset(form: AssetFormData): FormErrors<AssetFormData> {
  const errors: FormErrors<AssetFormData> = {};

  const nameError = required('Asset name')(form.name);
  if (nameError) errors.name = nameError;

  const typeError = required('Asset type')(form.type);
  if (typeError) errors.type = typeError;

  const locationError = required('Location')(form.locationId);
  if (locationError) errors.locationId = locationError;

  const purchaseDateError = required('Purchase date')(form.purchaseDate);
  if (purchaseDateError) errors.purchaseDate = purchaseDateError;

  const purchasePriceError = required('Purchase price')(form.purchasePrice);
  if (purchasePriceError) errors.purchasePrice = purchasePriceError;
  else if (Number(form.purchasePrice) < 0)
    errors.purchasePrice = 'Purchase price must be a positive number';

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssetForm(props: AssetFormProps) {
  const { mode } = props;
  const isEdit = mode === 'edit';

  const { data: locations = [] } = useStorageLocations();
  const { form, errors, set, handleSubmit } = useEntityForm<AssetFormData>(
    isEdit ? assetToForm((props as EditProps).asset) : EMPTY_FORM,
    validateAsset
  );

  const locationOptions: SelectOption[] = locations.map((loc) => ({
    value: String(loc.id),
    label: loc.locationName,
  }));

  return (
    <form id={ASSET_FORM_ID} onSubmit={handleSubmit(props.onSubmit)}>
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
                <TextField
                  className="md:col-span-2"
                  label="Asset Name"
                  name="name"
                  required
                  placeholder="e.g., Excavator CAT 320D"
                  value={form.name}
                  set={set}
                  error={errors.name}
                />

                <TextareaField
                  className="md:col-span-2"
                  label="Description"
                  name="description"
                  placeholder="Enter asset description..."
                  rows={3}
                  value={form.description}
                  set={set}
                />

                <SelectField
                  label="Asset Type"
                  name="type"
                  required
                  placeholder="Select type"
                  options={typeOptions}
                  value={form.type}
                  set={set}
                  error={errors.type}
                />

                <TextField
                  label="Category"
                  name="category"
                  placeholder="e.g., Excavators"
                  value={form.category}
                  set={set}
                />

                <TextField
                  label="Manufacturer"
                  name="manufacturer"
                  placeholder="e.g., Caterpillar"
                  value={form.manufacturer}
                  set={set}
                />

                <TextField
                  label="Model"
                  name="model"
                  placeholder="e.g., 320D"
                  value={form.model}
                  set={set}
                />

                <TextField
                  label="Serial Number"
                  name="serialNumber"
                  placeholder="e.g., CAT320D2024001"
                  value={form.serialNumber}
                  set={set}
                />

                <TextField
                  label="Registration Number"
                  name="registrationNumber"
                  placeholder="e.g., KA-01-EQ-1234"
                  value={form.registrationNumber}
                  set={set}
                />
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
                <DateField
                  label="Purchase Date"
                  name="purchaseDate"
                  required
                  value={form.purchaseDate}
                  set={set}
                  error={errors.purchaseDate}
                />

                <TextField
                  label="Purchase Price (₹)"
                  name="purchasePrice"
                  required
                  type="number"
                  min="0"
                  placeholder="e.g., 8500000"
                  value={form.purchasePrice}
                  set={set}
                  error={errors.purchasePrice}
                />

                <TextField
                  label="Depreciation Rate (%)"
                  name="depreciationRate"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 10"
                  value={form.depreciationRate}
                  set={set}
                />

                <DateField
                  label="Warranty Expiry"
                  name="warrantyExpiry"
                  value={form.warrantyExpiry}
                  set={set}
                />
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
                  <TextField
                    label="Current Usage Hours"
                    name="usageHours"
                    type="number"
                    min="0"
                    placeholder="e.g., 4200"
                    value={form.usageHours}
                    set={set}
                  />
                )}

                <TextField
                  label="Max Usage Hours"
                  name="maxUsageHours"
                  type="number"
                  min="0"
                  placeholder="e.g., 15000"
                  value={form.maxUsageHours}
                  set={set}
                />

                <SelectField
                  label="Fuel Type"
                  name="fuelType"
                  placeholder="Select fuel type"
                  options={fuelOptions}
                  noneOption={{ value: 'none', label: 'Not specified' }}
                  value={form.fuelType}
                  set={set}
                />

                <TextField
                  className="md:col-span-2"
                  label="Maintenance Schedule"
                  name="maintenanceSchedule"
                  placeholder="e.g., Every 500 hours"
                  value={form.maintenanceSchedule}
                  set={set}
                />

                {isEdit && (
                  <>
                    <DateField
                      label="Last Maintenance Date"
                      name="lastMaintenanceDate"
                      value={form.lastMaintenanceDate}
                      set={set}
                    />

                    <DateField
                      label="Next Maintenance Date"
                      name="nextMaintenanceDate"
                      value={form.nextMaintenanceDate}
                      set={set}
                    />
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
                <TextField
                  label="Insurance Provider"
                  name="insuranceProvider"
                  placeholder="e.g., HDFC Ergo"
                  value={form.insuranceProvider}
                  set={set}
                />

                <TextField
                  label="Policy Number"
                  name="policyNumber"
                  placeholder="e.g., HDFC-EQ-2024-001"
                  value={form.policyNumber}
                  set={set}
                />

                <DateField
                  label="Insurance Expiry"
                  name="insuranceExpiry"
                  value={form.insuranceExpiry}
                  set={set}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <TextareaField
                label="Notes"
                name="notes"
                placeholder="Any additional notes or comments..."
                rows={4}
                value={form.notes}
                set={set}
              />
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
              <SelectField
                label="Status"
                name="status"
                required
                options={statusOptions}
                value={form.status}
                set={set}
              />

              <SelectField
                label="Condition"
                name="condition"
                required
                options={conditionOptions}
                value={form.condition}
                set={set}
              />

              <SelectField
                label="Location"
                name="locationId"
                required
                placeholder="Select location"
                options={locationOptions}
                noneOption={{ value: 'none', label: 'Select location' }}
                value={form.locationId}
                set={set}
                error={errors.locationId}
              />
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                label="Assigned To"
                name="assignedTo"
                placeholder="e.g., John Doe"
                value={form.assignedTo}
                set={set}
              />

              <TextField
                label="Assigned Project"
                name="assignedProject"
                placeholder="e.g., Metro Line Extension"
                value={form.assignedProject}
                set={set}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
