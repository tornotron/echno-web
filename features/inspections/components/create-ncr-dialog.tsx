'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
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
import { useCreateNcrDefect } from '@/hooks/inspection';
import { NcrSeverity, ncrSeverityLabels } from '@/types/inspection';
import { MediaPicker } from './attachment-gallery';

/** Sentinel for "nobody yet" — Radix Select cannot hold an empty string value. */
const UNASSIGNED = 'UNASSIGNED';

interface CreateNcrDialogProps {
  /** Pre-links the NCR to the inspection and checklist item it came from. */
  inspectionId?: number;
  checklistElementId?: string;
  checklistElementLabel?: string;
  defaultProjectId?: number;
  trigger?: React.ReactNode;
}

export function CreateNcrDialog({
  inspectionId,
  checklistElementId,
  checklistElementLabel,
  defaultProjectId,
  trigger,
}: CreateNcrDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const createDefect = useCreateNcrDefect();

  const [title, setTitle] = useState(checklistElementLabel ?? '');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(
    defaultProjectId ? String(defaultProjectId) : ''
  );
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<NcrSeverity>(NcrSeverity.medium);
  const [responsible, setResponsible] = useState(UNASSIGNED);
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const canSubmit = title.trim() !== '' && projectId !== '';

  const handleSubmit = () => {
    createDefect.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: Number(projectId),
        inspectionId,
        checklistElementId,
        checklistElementLabel,
        location: location.trim() || undefined,
        severity,
        responsibleId:
          responsible === UNASSIGNED ? undefined : Number(responsible),
        dueDate: dueDate || undefined,
        files: files.length > 0 ? files : undefined,
      },
      {
        onSuccess: () => {
          setTitle(checklistElementLabel ?? '');
          setDescription('');
          setLocation('');
          setResponsible(UNASSIGNED);
          setDueDate('');
          setFiles([]);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Raise NCR
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise NCR / Defect</DialogTitle>
          <DialogDescription>
            {checklistElementLabel
              ? `Linked to the checklist item "${checklistElementLabel}".`
              : 'Record a non-conformance against a project.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ncr-title">Title</Label>
            <Input
              id="ncr-title"
              value={title}
              placeholder="e.g. Missing edge protection on Level 4"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ncr-project">Project</Label>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={Boolean(defaultProjectId)}
            >
              <SelectTrigger id="ncr-project" className="w-full">
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
            <Label htmlFor="ncr-responsible">Responsible</Label>
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger id="ncr-responsible" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>
                  Unassigned — decide later
                </SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ncr-severity">Severity</Label>
              <Select
                value={severity}
                onValueChange={(value) => setSeverity(value as NcrSeverity)}
              >
                <SelectTrigger id="ncr-severity" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(NcrSeverity).map((value) => (
                    <SelectItem key={value} value={value}>
                      {ncrSeverityLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ncr-due">Due Date</Label>
              <Input
                id="ncr-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ncr-location">Location</Label>
            <Input
              id="ncr-location"
              value={location}
              placeholder="Block B, Level 4"
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ncr-description">Description</Label>
            <Textarea
              id="ncr-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Evidence</Label>
            <MediaPicker files={files} onChange={setFiles} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || createDefect.isPending}
            onClick={handleSubmit}
          >
            {createDefect.isPending ? 'Raising…' : 'Raise NCR'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
