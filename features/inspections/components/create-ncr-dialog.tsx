'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateNcr, useInspections } from '@/hooks/inspection';
import { DefectSeverity, defectSeverityLabels } from '@/types/inspection';

/** Sentinel for "nobody yet": Radix Select cannot hold an empty string value. */
const UNASSIGNED = 'UNASSIGNED';

interface CreateNcrDialogProps {
  /**
   * The inspection the NCR is raised against. An NCR cannot exist without
   * one, so when the caller does not supply it the dialog asks for it.
   */
  inspectionId?: string;
  /** The inspection defect row this came from, when it came from one. */
  defectId?: string;
  /** Prefills the title, e.g. with the check point that failed. */
  defaultTitle?: string;
  trigger?: React.ReactNode;
}

export function CreateNcrDialog({
  inspectionId,
  defectId,
  defaultTitle,
  trigger,
}: CreateNcrDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: employees = [] } = useEmployeeLookup();
  // Feeds the inspection picker below, which only appears when the caller did
  // not already pin the NCR to one. The list is shared cache, so the extra
  // subscription costs nothing on pages that already show inspections.
  const { data: inspections = [] } = useInspections();
  const createNcr = useCreateNcr();

  const [inspection, setInspection] = useState(inspectionId ?? '');
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>(
    DefectSeverity.MAJOR
  );
  const [engineer, setEngineer] = useState(UNASSIGNED);
  const [targetDate, setTargetDate] = useState('');

  const chosenInspection = inspectionId ?? inspection;
  const canSubmit =
    chosenInspection !== '' && title.trim() !== '' && description.trim() !== '';

  const handleSubmit = () => {
    createNcr.mutate(
      {
        inspectionId: chosenInspection,
        defectId,
        title: title.trim(),
        description: description.trim(),
        severity,
        siteEngineerId: engineer === UNASSIGNED ? undefined : Number(engineer),
        targetDate: targetDate || undefined,
      },
      {
        onSuccess: () => {
          setTitle(defaultTitle ?? '');
          setDescription('');
          setEngineer(UNASSIGNED);
          setTargetDate('');
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
          <DialogTitle>Raise NCR</DialogTitle>
          <DialogDescription>
            {defectId
              ? 'Linked to the defect recorded on this inspection.'
              : 'Record a non-conformance against an inspection.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/*
            Hidden when the caller already knows the inspection: raising from
            an inspection page should not ask which one it is.
          */}
          {!inspectionId && (
            <div className="space-y-1.5">
              <Label htmlFor="ncr-inspection">Inspection</Label>
              <Select value={inspection} onValueChange={setInspection}>
                <SelectTrigger id="ncr-inspection" className="w-full">
                  <SelectValue placeholder="Select an inspection" />
                </SelectTrigger>
                <SelectContent>
                  {inspections.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.inspectionNumber} · {row.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label htmlFor="ncr-description">Description</Label>
            <Textarea
              id="ncr-description"
              rows={3}
              value={description}
              placeholder="What is non-conforming, and against what requirement"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ncr-severity">Severity</Label>
              <Select
                value={severity}
                onValueChange={(value) => setSeverity(value as DefectSeverity)}
              >
                <SelectTrigger id="ncr-severity" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DefectSeverity).map((value) => (
                    <SelectItem key={value} value={value}>
                      {defectSeverityLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ncr-target">Target Date</Label>
              <Input
                id="ncr-target"
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ncr-engineer">Site Engineer</Label>
            <Select value={engineer} onValueChange={setEngineer}>
              <SelectTrigger id="ncr-engineer" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>
                  Unassigned, decide later
                </SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || createNcr.isPending}
            onClick={handleSubmit}
          >
            {createNcr.isPending ? 'Raising…' : 'Raise NCR'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
