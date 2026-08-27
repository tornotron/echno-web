'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  inspectionTypeLabels,
  inspectionStatusLabels,
  inspectionResultLabels,
} from '@/types/inspection';
import type {
  Inspection,
  InspectionCheckItemRequest,
} from '@/types/inspection';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { toast } from '@/lib/styles/toast-styles';
import {
  InspectionCheckItemsField,
  toCheckItemDrafts,
  type CheckItemDraft,
} from './inspection-check-items-field';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// The form only carries fields the backend inspection DTO owns. The inspection
// number, initial status and the summary counts are assigned server-side, so
// they are not part of the form state.
export interface InspectionFormState {
  title: string;
  type: InspectionType | '';
  status: InspectionStatus | '';
  result: InspectionResult | '';
  projectId: string;
  location: string;
  areaInspected: string;
  scheduledDate: string;
  scheduledTime: string;
  inspectorId: string;
  clientRepresentative: string;
  drawingReference: string;
  weatherConditions: string;
  temperature: string;
}

export interface InspectionFormSubmitData {
  fields: InspectionFormState;
  /**
   * The checkpoints as the API wants them. Kept beside the string-valued
   * `fields` rather than inside it, because a checkpoint is a record of its
   * own rather than a single input.
   */
  checkItems: InspectionCheckItemRequest[];
}

interface CreateProps {
  mode: 'create';
  onSubmit: (data: InspectionFormSubmitData) => void;
}

interface EditProps {
  mode: 'edit';
  inspection: Inspection;
  onSubmit: (data: InspectionFormSubmitData) => void;
}

type InspectionFormProps = CreateProps | EditProps;

export const INSPECTION_FORM_ID = 'inspection-form';

const EMPTY_FORM: InspectionFormState = {
  title: '',
  type: '',
  status: '',
  result: '',
  projectId: '',
  location: '',
  areaInspected: '',
  scheduledDate: '',
  scheduledTime: '',
  inspectorId: '',
  clientRepresentative: '',
  drawingReference: '',
  weatherConditions: '',
  temperature: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectionForm(props: InspectionFormProps) {
  const isEdit = props.mode === 'edit';

  const { data: projects = [], isPending: isLoadingProjects } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();

  const [form, setForm] = useState<InspectionFormState>(() => {
    if (props.mode !== 'edit') return EMPTY_FORM;
    const inspection = (props as EditProps).inspection;
    return {
      title: inspection.title,
      type: inspection.type,
      status: inspection.status,
      result: inspection.result || '',
      projectId: inspection.projectId?.toString() || '',
      location: inspection.location || '',
      areaInspected: inspection.areaInspected || '',
      scheduledDate: inspection.scheduledDate || '',
      scheduledTime: inspection.scheduledTime || '',
      inspectorId: inspection.inspectorId?.toString() ?? '',
      clientRepresentative: inspection.clientRepresentative || '',
      drawingReference: inspection.drawingReference || '',
      weatherConditions: inspection.weatherConditions || '',
      temperature: inspection.temperature || '',
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Checkpoints are edited as drafts and converted on submit. In edit mode they
  // are seeded from what the inspection already has, because the API replaces
  // the whole list on save: anything not sent back is deleted.
  const [checkItems, setCheckItems] = useState<CheckItemDraft[]>(() =>
    props.mode === 'edit'
      ? toCheckItemDrafts((props as EditProps).inspection.checkItems)
      : []
  );
  const [checkItemErrors, setCheckItemErrors] = useState<
    Record<string, string>
  >({});

  // Name of the project the record is already against, for the read-only edit
  // view. Undefined while the project list loads, and if the project has since
  // been removed from the tenant.
  const selectedProjectName = projects.find(
    (project) => project.id.toString() === form.projectId
  )?.projectName;

  // ---------------------------------------------------------------------------
  // Error helpers
  // ---------------------------------------------------------------------------

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function setField<K extends keyof InspectionFormState>(
    field: K,
    value: InspectionFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = 'Inspection title is required';
    if (!form.type) newErrors.type = 'Please select an inspection type';
    if (isEdit && !form.status) newErrors.status = 'Please select a status';
    if (!form.projectId) newErrors.projectId = 'Please select a project';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    if (!form.areaInspected.trim())
      newErrors.areaInspected = 'Area to be inspected is required';
    if (!form.scheduledDate)
      newErrors.scheduledDate = 'Scheduled date is required';
    if (!form.inspectorId) newErrors.inspectorId = 'Please select an inspector';

    setErrors(newErrors);

    // A checkpoint needs both a category and the check itself; the backend
    // rejects either being blank, so catch it here where the row can be
    // pointed at rather than letting the whole save fail.
    const newCheckItemErrors: Record<string, string> = {};
    for (const item of checkItems) {
      if (!item.category.trim() && !item.checkPoint.trim()) {
        newCheckItemErrors[item.key] =
          'Give this checkpoint a category and a check point, or remove it';
      } else if (!item.category.trim()) {
        newCheckItemErrors[item.key] = 'Category is required';
      } else if (!item.checkPoint.trim()) {
        newCheckItemErrors[item.key] = 'Check point is required';
      }
    }
    setCheckItemErrors(newCheckItemErrors);

    const hasCheckItemErrors = Object.keys(newCheckItemErrors).length > 0;

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (hasCheckItemErrors) {
      toast.error('Please complete or remove the incomplete checkpoints');
      return false;
    }

    return true;
  }

  /** The drafts as the API wants them, with the blank optionals dropped. */
  function toCheckItemRequests(): InspectionCheckItemRequest[] {
    return checkItems.map((item) => ({
      category: item.category.trim(),
      checkPoint: item.checkPoint.trim(),
      specification: item.specification.trim() || undefined,
      status: item.status,
      remarks: item.remarks.trim() || undefined,
      photosRequired: item.photosRequired,
      photos: item.photos,
      measurement: item.measurement.trim() || undefined,
      expectedValue: item.expectedValue.trim() || undefined,
      priority: item.priority.trim() || undefined,
    }));
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    props.onSubmit({ fields: form, checkItems: toCheckItemRequests() });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form id={INSPECTION_FORM_ID} onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              {isEdit
                ? 'Update the basic details about the inspection'
                : 'Enter the basic details about the inspection'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Inspection Title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g., Foundation Quality Inspection"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div
              className={`grid gap-4 ${isEdit ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
            >
              <div className="space-y-2">
                <Label htmlFor="type">
                  Inspection Type <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setField('type', v as InspectionType)}
                >
                  <SelectTrigger
                    id="type"
                    className={errors.type ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Select inspection type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(inspectionTypeLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type}</p>
                )}
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setField('status', v as InspectionStatus)
                    }
                  >
                    <SelectTrigger
                      id="status"
                      className={errors.status ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inspectionStatusLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status}</p>
                  )}
                </div>
              )}

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="result">Result</Label>
                  <Select
                    value={form.result}
                    onValueChange={(v) =>
                      setField('result', v as InspectionResult)
                    }
                  >
                    <SelectTrigger id="result">
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inspectionResultLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/*
              The project is chosen once, when the inspection is created, and is
              read-only from then on. A statutory approval has to keep a
              permanent, traceable relationship with the project it was obtained
              for, so the record is shown rather than offered as a dropdown. The
              backend refuses a reassignment as well.
            */}
            <div className="space-y-2">
              <Label htmlFor="project">
                Project {!isEdit && <span className="text-red-600">*</span>}
              </Label>
              {isEdit ? (
                <>
                  <div
                    id="project"
                    className="bg-muted/50 text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm"
                  >
                    {isLoadingProjects
                      ? 'Loading…'
                      : (selectedProjectName ?? 'Project no longer available')}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Set when the inspection was created and fixed for the life of
                    the record.
                  </p>
                </>
              ) : (
                <>
                  <Select
                    value={form.projectId}
                    onValueChange={(v) => setField('projectId', v)}
                  >
                    <SelectTrigger
                      id="project"
                      className={errors.projectId ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id.toString()}
                        >
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && (
                    <p className="text-sm text-red-500">{errors.projectId}</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>
              {isEdit
                ? 'Update location and area information'
                : 'Specify where the inspection will take place'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-600">*</span>
              </Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="e.g., Building A - Ground Floor"
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaInspected">
                {isEdit ? 'Area Inspected' : 'Area to be Inspected'}{' '}
                <span className="text-red-600">*</span>
              </Label>
              <Input
                id="areaInspected"
                value={form.areaInspected}
                onChange={(e) => setField('areaInspected', e.target.value)}
                placeholder="e.g., Foundation - Block A"
                className={errors.areaInspected ? 'border-red-500' : ''}
              />
              {errors.areaInspected && (
                <p className="text-sm text-red-500">{errors.areaInspected}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawingReference">
                Drawing Reference (Optional)
              </Label>
              <Input
                id="drawingReference"
                value={form.drawingReference}
                onChange={(e) => setField('drawingReference', e.target.value)}
                placeholder="e.g., DRG-FND-001"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Personnel */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Personnel</CardTitle>
            <CardDescription>
              {isEdit
                ? 'Update inspection schedule and personnel'
                : 'Set the inspection date and assign personnel'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">
                  Scheduled Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setField('scheduledDate', e.target.value)}
                  className={errors.scheduledDate ? 'border-red-500' : ''}
                />
                {errors.scheduledDate && (
                  <p className="text-sm text-red-500">{errors.scheduledDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Scheduled Time (Optional)</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setField('scheduledTime', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector">
                Inspector <span className="text-red-600">*</span>
              </Label>
              <Select
                value={form.inspectorId}
                onValueChange={(v) => setField('inspectorId', v)}
              >
                <SelectTrigger
                  id="inspector"
                  className={errors.inspectorId ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id?.toString() || ''}
                    >
                      {employee.name} - {employee.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.inspectorId && (
                <p className="text-sm text-red-500">{errors.inspectorId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientRepresentative">
                Client Representative (Optional)
              </Label>
              <Input
                id="clientRepresentative"
                value={form.clientRepresentative}
                onChange={(e) =>
                  setField('clientRepresentative', e.target.value)
                }
                placeholder="e.g., Mr. Sharma"
              />
            </div>
          </CardContent>
        </Card>

        {/* Weather & Conditions — edit mode only */}
        {isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Weather & Conditions</CardTitle>
              <CardDescription>
                Record weather and site conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weatherConditions">
                    Weather Conditions (Optional)
                  </Label>
                  <Input
                    id="weatherConditions"
                    value={form.weatherConditions}
                    onChange={(e) =>
                      setField('weatherConditions', e.target.value)
                    }
                    placeholder="e.g., Clear, Sunny"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (Optional)</Label>
                  <Input
                    id="temperature"
                    value={form.temperature}
                    onChange={(e) => setField('temperature', e.target.value)}
                    placeholder="e.g., 28°C"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <InspectionCheckItemsField
          value={checkItems}
          onChange={(next) => {
            setCheckItems(next);
            setCheckItemErrors({});
          }}
          errors={checkItemErrors}
        />
      </div>
    </form>
  );
}
