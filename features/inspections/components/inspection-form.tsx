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
import { Textarea } from '@/components/shadcn/textarea';
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
import type { Inspection } from '@/types/inspection';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { toast } from '@/lib/styles/toast-styles';

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

  const { data: projects = [] } = useProjects();
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

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields');
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    props.onSubmit({ fields: form });
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

            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-red-600">*</span>
              </Label>
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
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-500">{errors.projectId}</p>
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
      </div>
    </form>
  );
}
