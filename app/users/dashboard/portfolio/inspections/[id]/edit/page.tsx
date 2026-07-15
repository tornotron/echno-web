'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useInspectionById } from '@/hooks/inspection';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
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
  const inspectionId = Number.parseInt(params.id as string);

  const { data: inspectionData, isLoading } = useInspectionById(inspectionId);
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: InspectionFormSubmitData) {
    const { fields } = data;
    setIsSubmitting(true);
    try {
      // Simulate API call — inspection module not yet wired to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const project = projects.find(
        (p) => p.id === Number.parseInt(fields.projectId)
      );
      const inspector = employees.find(
        (emp) => emp.id === Number.parseInt(fields.inspectorId)
      );

      logger.debug('Updating inspection:', {
        id: inspectionId,
        title: fields.title,
        type: fields.type,
        status: fields.status,
        result: fields.result || undefined,
        projectId: Number.parseInt(fields.projectId),
        projectName: project?.projectName,
        location: fields.location,
        areaInspected: fields.areaInspected,
        scheduledDate: new Date(fields.scheduledDate),
        scheduledTime: fields.scheduledTime || undefined,
        inspectorId: Number.parseInt(fields.inspectorId),
        inspectorName: inspector?.name,
        contractorName: fields.contractorName || undefined,
        clientRepresentative: fields.clientRepresentative || undefined,
        drawingReference: fields.drawingReference || undefined,
        observationsAndComments: fields.observationsAndComments || undefined,
        recommendations: fields.recommendations || undefined,
        weatherConditions: fields.weatherConditions || undefined,
        temperature: fields.temperature || undefined,
        reinspectionRequired: fields.reinspectionRequired,
        reinspectionDate: fields.reinspectionDate
          ? new Date(fields.reinspectionDate)
          : undefined,
        reinspectionNotes: fields.reinspectionNotes || undefined,
        updatedAt: new Date(),
      });

      toast.success('Inspection updated successfully!');
      router.push(
        routes.portfolio.inspections.detail(params.id as string).href
      );
    } catch (error) {
      logger.error('Error updating inspection:', error);
      toast.error('Failed to update inspection');
    } finally {
      setIsSubmitting(false);
    }
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
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
