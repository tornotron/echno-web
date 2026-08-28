'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInspection } from '@/hooks/inspection';
import { InspectionType, inspectionTypeLabels } from '@/types/inspection';

interface CreateInspectionDialogProps {
  /**
   * Pins the inspection type. The QA/QC and Safety pages each fix their own;
   * it is left off on the overview, where the type is chosen in the dialog.
   */
  type?: InspectionType;
}

const today = () => new Date().toISOString().slice(0, 10);

export function CreateInspectionDialog({
  type: pinnedType,
}: CreateInspectionDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const createInspection = useCreateInspection();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [chosenType, setChosenType] = useState<InspectionType>(
    pinnedType ?? InspectionType.QUALITY
  );
  const [location, setLocation] = useState('');
  const [scheduledDate, setScheduledDate] = useState(today);

  const type = pinnedType ?? chosenType;

  // The backend requires a title, a type, a scheduled date and an inspector;
  // the project is optional there but an inspection filed against no project
  // never surfaces in the project-scoped lists, so it is required here too.
  const canSubmit =
    title.trim() !== '' &&
    projectId !== '' &&
    inspectorId !== '' &&
    scheduledDate !== '';

  const reset = () => {
    setTitle('');
    setProjectId('');
    setInspectorId('');
    setChosenType(pinnedType ?? InspectionType.QUALITY);
    setLocation('');
    setScheduledDate(today());
  };

  const handleSubmit = () => {
    createInspection.mutate(
      {
        title: title.trim(),
        type,
        projectId: Number(projectId),
        inspectorId: Number(inspectorId),
        scheduledDate,
        location: location.trim() || undefined,
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
              ? `New ${inspectionTypeLabels[pinnedType]}`
              : 'New Inspection'}
          </DialogTitle>
          <DialogDescription>
            Schedules the inspection. Its check points are added afterwards,
            from the inspection itself.
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
              <Select
                value={chosenType}
                onValueChange={(value) =>
                  setChosenType(value as InspectionType)
                }
              >
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
            <Label htmlFor="inspection-inspector">Inspector</Label>
            <Select value={inspectorId} onValueChange={setInspectorId}>
              <SelectTrigger id="inspection-inspector" className="w-full">
                <SelectValue placeholder="Select an inspector" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                    {employee.designation ? ` (${employee.designation})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inspection-date">Scheduled date</Label>
              <Input
                id="inspection-date"
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
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
