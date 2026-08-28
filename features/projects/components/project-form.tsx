'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
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
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  FileText,
  MapPin,
  Loader2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ProjectStatus,
  ProjectType,
  getProjectStatusLabel,
} from '@tornotron/echno-core/project/types';
import type { Project } from '@tornotron/echno-core/project/types';
import { useGeolocation } from '@/hooks/use-geolocation';
import { INDIAN_STATES } from '../constants/indian-states';
import { format } from 'date-fns';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';
import { useDeleteAttachment } from '@tornotron/echno-core/attachment/hooks';
import { AttachmentsSection } from '@/components/common';
import type { FileUploadState } from '@/hooks/use-direct-attachment-upload';
import { Progress } from '@/components/shadcn/progress';
import { useFormDraft, useFormDraftScope } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { FormDraftBanner } from '@/components/common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Every status a project can hold, which is what the edit form offers. */
export const PROJECT_STATUSES = [
  ProjectStatus.upcoming,
  ProjectStatus.approved,
  ProjectStatus.open,
  ProjectStatus.onHold,
  ProjectStatus.completed,
  ProjectStatus.closed,
  ProjectStatus.cancelled,
  ProjectStatus.dropped,
];

/**
 * The statuses a project can be created in.
 *
 * `approved` is left out deliberately. Approval checks that the project's state
 * is known and publishes the event that draws up its compliance inspections, so
 * it runs through the approval action on the project rather than through the
 * create payload. The API refuses `approved` on create for the same reason, and
 * defaults to `upcoming` when the payload names no status at all.
 */
export const CREATE_PROJECT_STATUSES = PROJECT_STATUSES.filter(
  (status) => status !== ProjectStatus.approved
);

const PROJECT_TYPES = [
  ProjectType.RESIDENTIAL,
  ProjectType.COMMERCIAL,
  ProjectType.INDUSTRIAL,
  ProjectType.INFRASTRUCTURE,
  ProjectType.INSTITUTIONAL,
  ProjectType.MIXED_USE,
  ProjectType.OTHER,
];

const projectTypeLabels: Record<ProjectType, string> = {
  [ProjectType.RESIDENTIAL]: 'Residential',
  [ProjectType.COMMERCIAL]: 'Commercial',
  [ProjectType.INDUSTRIAL]: 'Industrial',
  [ProjectType.INFRASTRUCTURE]: 'Infrastructure',
  [ProjectType.INSTITUTIONAL]: 'Institutional',
  [ProjectType.MIXED_USE]: 'Mixed use',
  [ProjectType.OTHER]: 'Other',
};

const PROJECT_TYPE_NONE = 'none';

// shadcn's Select cannot carry an empty-string item value, so "not stated" needs
// a sentinel of its own, the same way the project-type field already does it.
const PROJECT_STATE_NONE = 'none';

/** Matches the backend's cap on the address line. */
export const ADDRESS_MAX_LENGTH = 255;
/** Matches the backend's cap on the postal code column. */
export const POSTAL_CODE_MAX_LENGTH = 16;

export interface ProjectFormState {
  projectName: string;
  projectAddress: string;
  projectCity: string;
  projectState: string;
  projectPostalCode: string;
  status: ProjectStatus;
  projectType: ProjectType | '';
  projectLatitude: string;
  projectLongitude: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectFormSubmitData {
  fields: ProjectFormState;
  attachments: File[];
  createLocationForProject: boolean;
}

interface CreateProps {
  mode: 'create';
  /** Per-file direct-upload progress, index-aligned to the selected files. */
  uploadStates?: FileUploadState[];
  onSubmit: (data: ProjectFormSubmitData) => void;
}

interface EditProps {
  mode: 'edit';
  project: Project;
  /** Per-file direct-upload progress, index-aligned to the selected files. */
  uploadStates?: FileUploadState[];
  onSubmit: (data: ProjectFormSubmitData) => void;
}

type ProjectFormProps = CreateProps | EditProps;

export const PROJECT_FORM_ID = 'project-form';

/**
 * What a locally kept draft of this form holds.
 *
 * Attachments are absent by design: a `File` cannot be stored and half an
 * upload is not a draft. Everything the user typed is here.
 */
interface ProjectFormDraft {
  fields: ProjectFormState;
  createLocationForProject: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getNewFileStatusIcon = (status?: FileUploadState['status']) => {
  if (status === 'done') {
    return (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
    );
  }
  if (status === 'error') {
    return (
      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
    );
  }
  return <FileText className="h-4 w-4 shrink-0 text-zinc-500" />;
};

/**
 * Checks a coordinate box. Blank is valid: coordinates are optional, and a
 * project can be described by its address alone. A value that is present has to
 * be a number in range, which is the same rule the API applies, caught here so
 * it does not cost a round trip.
 */
export function coordinateError(
  value: string,
  label: string,
  limit: number
): string | null {
  if (value.trim() === '') return null;
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return `${label} must be a number`;
  if (parsed < -limit || parsed > limit) {
    return `${label} must be between -${limit} and ${limit}`;
  }
  return null;
}

const EMPTY_FORM: ProjectFormState = {
  projectName: '',
  projectAddress: '',
  projectCity: '',
  projectState: '',
  projectPostalCode: '',
  status: ProjectStatus.upcoming,
  projectType: '',
  projectLatitude: '',
  projectLongitude: '',
  startDate: '',
  endDate: '',
  description: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectForm(props: ProjectFormProps) {
  const isEdit = props.mode === 'edit';

  const [form, setForm] = useState<ProjectFormState>(() => {
    if (props.mode !== 'edit') return EMPTY_FORM;
    const project = (props as EditProps).project;
    return {
      projectName: project.projectName,
      projectAddress: project.projectAddress,
      // Absent on every project created before these fields existed.
      projectCity: project.projectCity ?? '',
      projectState: project.projectState ?? '',
      projectPostalCode: project.projectPostalCode ?? '',
      status: project.status,
      projectType: project.projectType ?? '',
      projectLatitude: project.projectLatitude.toString(),
      projectLongitude: project.projectLongitude.toString(),
      startDate: project.startDate
        ? format(project.startDate, 'yyyy-MM-dd')
        : '',
      endDate: project.endDate ? format(project.endDate, 'yyyy-MM-dd') : '',
      description: '',
    };
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [createLocationForProject, setCreateLocationForProject] =
    useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deleteAttachment = useDeleteAttachment();

  // This is the form that lost a co-founder twenty minutes of entry when his
  // session ended mid-typing, so it is the first one to keep a local draft.
  const draftScope = useFormDraftScope();
  const draftValues = useMemo<ProjectFormDraft>(
    () => ({ fields: form, createLocationForProject }),
    [form, createLocationForProject]
  );
  const applyDraft = useCallback((values: ProjectFormDraft) => {
    setForm(values.fields);
    setCreateLocationForProject(values.createLocationForProject === true);
  }, []);
  const { draft, restoreDraft, discardDraft } = useFormDraft<ProjectFormDraft>({
    formId: FORM_DRAFT_IDS.PROJECT,
    scope: draftScope,
    recordId: props.mode === 'edit' ? props.project.id : undefined,
    values: draftValues,
    onRestore: applyDraft,
  });

  const { isLoading: isGettingLocation, getCurrentLocation } = useGeolocation();

  function handleUploadFiles(files: File[]) {
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) invalid.push(f.name);
      else valid.push(f);
    }
    if (invalid.length > 0)
      toast.error('Some files exceed 10MB', {
        description: `Not added: ${invalid.join(', ')}`,
      });
    if (valid.length > 0) setAttachments((prev) => [...prev, ...valid]);
  }

  async function handleDeleteAttachment(id: number) {
    try {
      await deleteAttachment.mutateAsync(id);
      toast.success('Attachment deleted successfully');
    } catch {
      toast.error('Failed to delete attachment');
    }
  }

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

  function setField<K extends keyof ProjectFormState>(
    field: K,
    value: ProjectFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  const handleGetLocation = useCallback(() => {
    getCurrentLocation((lat, lng) => {
      setForm((prev) => ({
        ...prev,
        projectLatitude: lat.toString(),
        projectLongitude: lng.toString(),
      }));
    });
  }, [getCurrentLocation]);

  // ---------------------------------------------------------------------------
  // File upload (create mode)
  // ---------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = [...e.target.files];
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        invalid.push(file.name);
      } else {
        valid.push(file);
      }
    }
    if (invalid.length > 0) {
      toast.error('Some files exceed 10MB', {
        description: `Not added: ${invalid.join(', ')}`,
      });
    }
    if (valid.length > 0) {
      setAttachments((prev) => [...prev, ...valid]);
    }
    e.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    const nameError = required('Project name')(form.projectName);
    if (nameError) newErrors.projectName = nameError;

    const addressError = required('Project address')(form.projectAddress);
    if (addressError) {
      newErrors.projectAddress = addressError;
    } else if (form.projectAddress.length > ADDRESS_MAX_LENGTH) {
      newErrors.projectAddress = `Project address must be at most ${ADDRESS_MAX_LENGTH} characters`;
    }

    if (form.projectPostalCode.length > POSTAL_CODE_MAX_LENGTH) {
      newErrors.projectPostalCode = `PIN code must be at most ${POSTAL_CODE_MAX_LENGTH} characters`;
    }

    const latError = coordinateError(form.projectLatitude, 'Latitude', 90);
    if (latError) newErrors.projectLatitude = latError;
    const lngError = coordinateError(form.projectLongitude, 'Longitude', 180);
    if (lngError) newErrors.projectLongitude = lngError;

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
    props.onSubmit({ fields: form, attachments, createLocationForProject });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const existingAttachments = isEdit
    ? (props as EditProps).project.attachments
    : undefined;

  return (
    <form id={PROJECT_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
      <FormDraftBanner
        draft={draft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
        label="project details"
      />
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Update the details for this project'
              : 'Enter the basic details for the new project'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="projectName"
              value={form.projectName}
              onChange={(e) => setField('projectName', e.target.value)}
              placeholder="e.g., Sunrise Tower"
              className={errors.projectName ? 'border-red-500' : ''}
            />
            {errors.projectName && (
              <p className="text-sm text-red-500">{errors.projectName}</p>
            )}
          </div>

          {/* Project Address */}
          <div className="space-y-2">
            <Label htmlFor="projectAddress">
              Project Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="projectAddress"
              value={form.projectAddress}
              onChange={(e) => setField('projectAddress', e.target.value)}
              placeholder="Street address of the site"
              rows={3}
              maxLength={ADDRESS_MAX_LENGTH}
              className={`resize-none ${errors.projectAddress ? 'border-red-500' : ''}`}
            />
            {errors.projectAddress && (
              <p className="text-sm text-red-500">{errors.projectAddress}</p>
            )}
          </div>

          {/* City / State / PIN code */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="projectCity">
                City{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="projectCity"
                value={form.projectCity}
                onChange={(e) => setField('projectCity', e.target.value)}
                placeholder="e.g., Chennai"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectState">
                State{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Select
                value={form.projectState || PROJECT_STATE_NONE}
                onValueChange={(v) =>
                  setField('projectState', v === PROJECT_STATE_NONE ? '' : v)
                }
              >
                <SelectTrigger id="projectState" className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROJECT_STATE_NONE}>
                    Not specified
                  </SelectItem>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Decides which statutory compliances apply to this project.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectPostalCode">
                PIN Code{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="projectPostalCode"
                value={form.projectPostalCode}
                onChange={(e) => setField('projectPostalCode', e.target.value)}
                placeholder="e.g., 600004"
                maxLength={POSTAL_CODE_MAX_LENGTH}
                className={errors.projectPostalCode ? 'border-red-500' : ''}
              />
              {errors.projectPostalCode && (
                <p className="text-sm text-red-500">
                  {errors.projectPostalCode}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setField('status', v as ProjectStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select project status" />
              </SelectTrigger>
              <SelectContent>
                {(isEdit ? PROJECT_STATUSES : CREATE_PROJECT_STATUSES).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {getProjectStatusLabel(s)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType">
              Project Type{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select
              value={form.projectType || PROJECT_TYPE_NONE}
              onValueChange={(v) =>
                setField(
                  'projectType',
                  v === PROJECT_TYPE_NONE ? '' : (v as ProjectType)
                )
              }
            >
              <SelectTrigger id="projectType">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROJECT_TYPE_NONE}>Not specified</SelectItem>
                {PROJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {projectTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Drives which statutory compliances the AI analysis considers.
            </p>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Location Coordinates{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Get Current Location
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Only needed to place the site on a map and to check attendance
              against it. The address above is what drives compliance.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectLatitude">Latitude</Label>
                <Input
                  id="projectLatitude"
                  type="number"
                  step="any"
                  value={form.projectLatitude}
                  onChange={(e) => setField('projectLatitude', e.target.value)}
                  placeholder="e.g., 19.0760"
                  className={errors.projectLatitude ? 'border-red-500' : ''}
                />
                {errors.projectLatitude && (
                  <p className="text-sm text-red-500">
                    {errors.projectLatitude}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectLongitude">Longitude</Label>
                <Input
                  id="projectLongitude"
                  type="number"
                  step="any"
                  value={form.projectLongitude}
                  onChange={(e) => setField('projectLongitude', e.target.value)}
                  placeholder="e.g., 72.8777"
                  className={errors.projectLongitude ? 'border-red-500' : ''}
                />
                {errors.projectLongitude && (
                  <p className="text-sm text-red-500">
                    {errors.projectLongitude}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Enter project description"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Create mode only: inline file upload and createLocation checkbox */}
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>
                  Attachments{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <div className="space-y-4">
                  <div>
                    <input
                      id="attachments"
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        (
                          document.querySelector('#attachments') as HTMLElement
                        )?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF (Max 10MB each)
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Selected Files ({attachments.length})
                      </p>
                      {attachments.map((file, index) => {
                        const state = props.uploadStates?.[index];
                        return (
                          <div
                            key={index}
                            className="space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                {getNewFileStatusIcon(state?.status)}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                    {state?.status === 'uploading' &&
                                      ` · ${state.percent}%`}
                                    {state?.status === 'done' && ' · Uploaded'}
                                  </p>
                                </div>
                              </div>
                              {state?.status !== 'uploading' && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => removeAttachment(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {state?.status === 'uploading' && (
                              <Progress
                                value={state.percent}
                                className="h-1.5"
                              />
                            )}
                            {state?.status === 'error' && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                {state.error || 'Upload failed'}. This file was
                                not saved; remove it and try again.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  id="createLocation"
                  checked={createLocationForProject}
                  onCheckedChange={(checked) =>
                    setCreateLocationForProject(checked === true)
                  }
                />
                <div>
                  <label
                    htmlFor="createLocation"
                    className="cursor-pointer text-sm leading-none font-medium"
                  >
                    Create storage location for this project
                  </label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Automatically creates a Project Site storage location using
                    the same name, address, and coordinates.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit mode: show existing attachments section */}
      {isEdit && (
        <AttachmentsSection
          title="Project Attachments"
          existingAttachments={existingAttachments}
          newAttachments={attachments}
          uploadStates={props.uploadStates}
          onUploadFiles={handleUploadFiles}
          onRemoveAttachment={removeAttachment}
          onDeleteAttachment={handleDeleteAttachment}
        />
      )}
    </form>
  );
}
