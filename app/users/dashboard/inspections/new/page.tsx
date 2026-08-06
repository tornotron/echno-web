'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { InspectionStatus } from '@/types/inspection';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import {
  InspectionForm,
  type InspectionFormSubmitData,
} from '@/features/inspections/components';

export default function NewInspectionPage() {
  const router = useRouter();
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
      const inspectionNumber = `INS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

      logger.debug('Creating inspection:', {
        inspectionNumber,
        title: fields.title,
        type: fields.type,
        status: InspectionStatus.scheduled,
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
      });

      toast.success('Inspection scheduled successfully!');
      router.push(routes.inspections.href);
    } catch (error) {
      logger.error('Error creating inspection:', error);
      toast.error('Failed to create inspection');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Schedule New Inspection"
        description="Schedule a new inspection for your construction project"
      />
      <InspectionForm
        mode="create"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
