'use client';

import { useState, useCallback } from 'react';
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
import { FileText, MapPin, Loader2, Upload, X } from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import type { Project } from '@/types/project/project';
import { useGeolocation } from '@/hooks/use-geolocation';
import { format } from 'date-fns';
import { required } from '@/lib/validators';
import { toast } from '@/lib/styles/toast-styles';
import { AttachmentsSection } from './attachments-section';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const PROJECT_STATUSES = [
  ProjectStatus.upcoming,
  ProjectStatus.open,
  ProjectStatus.onHold,
  ProjectStatus.completed,
  ProjectStatus.closed,
  ProjectStatus.cancelled,
  ProjectStatus.dropped,
];

export interface ProjectFormState {
  projectName: string;
  projectAddress: string;
  status: ProjectStatus;
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
  onSubmit: (data: ProjectFormSubmitData) => void;
}

interface EditProps {
  mode: 'edit';
  project: Project;
  onSubmit: (data: ProjectFormSubmitData) => void;
}

type ProjectFormProps = CreateProps | EditProps;

export const PROJECT_FORM_ID = 'project-form';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const EMPTY_FORM: ProjectFormState = {
  projectName: '',
  projectAddress: '',
  status: ProjectStatus.upcoming,
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
      status: project.status,
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

  const { isLoading: isGettingLocation, getCurrentLocation } = useGeolocation();

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
    if (addressError) newErrors.projectAddress = addressError;
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
              placeholder="Enter the complete project address"
              rows={3}
              className={`resize-none ${errors.projectAddress ? 'border-red-500' : ''}`}
            />
            {errors.projectAddress && (
              <p className="text-sm text-red-500">{errors.projectAddress}</p>
            )}
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
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {getProjectStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                />
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
                />
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
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                                {file.name}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
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
          existingAttachments={existingAttachments}
          newAttachments={attachments}
          onAttachmentsChange={setAttachments}
          onRemoveAttachment={removeAttachment}
        />
      )}
    </form>
  );
}
