'use client';

import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { useCreateInspection } from '@/hooks/inspection';
import type {
  CreateInspectionRequest,
  InspectionType,
} from '@/types/inspection';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import {
  InspectionForm,
  INSPECTION_FORM_ID,
  type InspectionFormSubmitData,
} from '@/features/inspections/components';

export default function NewInspectionPage() {
  const router = useRouter();
  const { mutate: createInspection, isPending } = useCreateInspection();

  function handleSubmit(data: InspectionFormSubmitData) {
    const { fields } = data;

    // The backend assigns the inspection number and forces the initial status;
    // the summary counts are derived from the check items and defects. None of
    // those are sent from the schedule form.
    const req: CreateInspectionRequest = {
      title: fields.title,
      type: fields.type as InspectionType,
      projectId: Number.parseInt(fields.projectId),
      location: fields.location,
      areaInspected: fields.areaInspected,
      scheduledDate: fields.scheduledDate,
      inspectorId: Number.parseInt(fields.inspectorId),
      drawingReference: fields.drawingReference.trim() || undefined,
      scheduledTime: fields.scheduledTime.trim() || undefined,
      clientRepresentative: fields.clientRepresentative.trim() || undefined,
    };

    createInspection(req, {
      onSuccess: (inspection) => {
        toast.success('Inspection scheduled successfully!');
        router.push(routes.inspections.detail(inspection.id).href);
      },
      onError: (err) => {
        toast.error(getErrorTitle(err, 'Failed to create inspection'), {
          description: getErrorMessage(err),
        });
      },
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Schedule New Inspection"
        description="Schedule a new inspection for your construction project"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={INSPECTION_FORM_ID}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Schedule Inspection
                </>
              )}
            </Button>
          </>
        }
      />
      <InspectionForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
