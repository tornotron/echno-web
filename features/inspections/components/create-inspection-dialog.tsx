'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  useCreateInspection,
  useInspectionTemplates,
} from '@/hooks/inspection';
import { InspectionType, inspectionTypeLabels } from '@/types/inspection';

interface CreateInspectionDialogProps {
  /**
   * Pins the inspection type — the QA/QC and Safety pages each fix their own.
   * Left off on the overview, where the type is chosen inside the dialog.
   */
  type?: InspectionType;
}

const NO_TEMPLATE = 'NONE';

export function CreateInspectionDialog({
  type: pinnedType,
}: CreateInspectionDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useInspectionTemplates();
  const createInspection = useCreateInspection();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [chosenType, setChosenType] = useState<InspectionType>(
    pinnedType ?? InspectionType.qaQc
  );
  const [templateId, setTemplateId] = useState(NO_TEMPLATE);
  const [location, setLocation] = useState('');
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const type = pinnedType ?? chosenType;

  // Only templates authored for this inspection type are offered.
  const relevantTemplates = templates.filter(
    (template) => template.type === type
  );

  const canSubmit = title.trim() !== '' && projectId !== '';

  const reset = () => {
    setTitle('');
    setDescription('');
    setProjectId('');
    setChosenType(pinnedType ?? InspectionType.qaQc);
    setTemplateId(NO_TEMPLATE);
    setLocation('');
    setInspectionDate(new Date().toISOString().slice(0, 10));
  };

  // Templates belong to one type, so a type change invalidates the choice.
  const handleTypeChange = (value: string) => {
    setChosenType(value as InspectionType);
    setTemplateId(NO_TEMPLATE);
  };

  const handleSubmit = () => {
    createInspection.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        projectId: Number(projectId),
        location: location.trim() || undefined,
        inspectionDate,
        templateId: templateId === NO_TEMPLATE ? undefined : Number(templateId),
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Inspection
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {pinnedType
              ? `New ${inspectionTypeLabels[pinnedType]} Inspection`
              : 'New Inspection'}
          </DialogTitle>
          <DialogDescription>
            The selected checklist is pinned at its current published version,
            so later edits to the template will not change this inspection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inspection-title">Title</Label>
            <Input
              id="inspection-title"
              value={title}
              placeholder="e.g. Level 3 slab pour check"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {!pinnedType && (
            <div className="space-y-1.5">
              <Label htmlFor="inspection-type">Type</Label>
              <Select value={chosenType} onValueChange={handleTypeChange}>
                <SelectTrigger id="inspection-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(InspectionType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {inspectionTypeLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inspection-project">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="inspection-project" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inspection-template">Checklist</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="inspection-template" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEMPLATE}>No checklist</SelectItem>
                {relevantTemplates.map((template) => (
                  <SelectItem key={template.id} value={String(template.id)}>
                    {template.name}
                    {template.currentVersion > 0
                      ? ` (v${template.currentVersion})`
                      : ' (unpublished)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inspection-date">Inspection date</Label>
              <Input
                id="inspection-date"
                type="date"
                value={inspectionDate}
                onChange={(event) => setInspectionDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inspection-location">Location</Label>
              <Input
                id="inspection-location"
                value={location}
                placeholder="Block A, Level 3"
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inspection-description">Description</Label>
            <Textarea
              id="inspection-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || createInspection.isPending}
            onClick={handleSubmit}
          >
            {createInspection.isPending ? 'Creating…' : 'Create inspection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
