'use client';

import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import {
  useInspectionById,
  useUpdateInspection,
} from '@/hooks/inspection';
import type {
  UpdateInspectionRequest,
  InspectionType,
  InspectionStatus,
  InspectionResult,
} from '@/types/inspection';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import {
  InspectionForm,
  type InspectionFormSubmitData,
} from '@/features/inspections/components';

export default function EditInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const { data: inspectionData, isLoading } = useInspectionById(inspectionId);
  const { mutate: updateInspection, isPending } = useUpdateInspection();

  function handleSubmit(data: InspectionFormSubmitData) {
    if (!inspectionData) return;
    const { fields } = data;

    // PUT is a full replacement; the check items and defects are not edited on
    // this form, so the existing rows are threaded through unchanged. The
    // summary counts are recomputed server-side from them.
    const req: UpdateInspectionRequest = {
      title: fields.title,
      type: fields.type as InspectionType,
      status: fields.status as InspectionStatus,
      result: (fields.result || undefined) as InspectionResult | undefined,
      projectId: Number.parseInt(fields.projectId),
      location: fields.location,
      areaInspected: fields.areaInspected,
      scheduledDate: fields.scheduledDate,
      inspectorId: Number.parseInt(fields.inspectorId),
      drawingReference: fields.drawingReference.trim() || undefined,
      scheduledTime: fields.scheduledTime.trim() || undefined,
      clientRepresentative: fields.clientRepresentative.trim() || undefined,
      weatherConditions: fields.weatherConditions.trim() || undefined,
      temperature: fields.temperature.trim() || undefined,
      checkItems: inspectionData.checkItems.map((item) => ({
        category: item.category,
        checkPoint: item.checkPoint,
        specification: item.specification,
        status: item.status,
        remarks: item.remarks,
        photosRequired: item.photosRequired,
        photos: item.photos,
        measurement: item.measurement,
        expectedValue: item.expectedValue,
        priority: item.priority,
      })),
      defects: inspectionData.defects.map((defect) => ({
        category: defect.category,
        description: defect.description,
        severity: defect.severity,
        location: defect.location,
        photos: defect.photos,
        correctiveAction: defect.correctiveAction,
        responsibleParty: defect.responsibleParty,
        targetDate: defect.targetDate,
        status: defect.status,
        resolvedDate: defect.resolvedDate,
      })),
    };

    updateInspection(
      { id: inspectionId, req },
      {
        onSuccess: () => {
          toast.success('Inspection updated successfully!');
          router.push(routes.portfolio.inspections.detail(inspectionId).href);
        },
        onError: (err) => {
          toast.error(getErrorTitle(err, 'Failed to update inspection'), {
            description: getErrorMessage(err),
          });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!inspectionData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-zinc-500">Inspection not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Edit Inspection"
        description="Update inspection details and results"
      />
      <InspectionForm
        mode="edit"
        inspection={inspectionData}
        isSubmitting={isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
