'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { AlertTriangle, ClipboardList, Loader2, Send } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useCreateConsumption } from '@tornotron/echno-core/material-consumption/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import {
  MaterialConsumptionForm,
  MATERIAL_CONSUMPTION_FORM_ID,
  type MaterialConsumptionSubmitData,
} from '@/features/material-consumptions/components';

export default function NewConsumptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTaskId = Number(searchParams.get('taskId')) || 0;
  const fromTaskTitle = searchParams.get('taskTitle') ?? '';

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { mutate: createConsumption, isPending } = useCreateConsumption();

  function handleSubmit(data: MaterialConsumptionSubmitData) {
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current employee.');
      return;
    }
    const { form } = data;
    createConsumption(
      {
        consumptionDate: new Date(form.consumptionDate).toISOString(),
        materialId: form.materialId,
        quantity: Number.parseInt(form.quantity, 10),
        consumptionType: form.consumptionType,
        projectId: form.projectId || undefined,
        storageLocationId: form.storageLocationId || undefined,
        taskId: form.taskId || undefined,
        details: form.details.trim() || undefined,
        createdBy: currentEmployee.id,
      },
      {
        onSuccess: (consumption) => {
          toast.success('Consumption Recorded', {
            description: 'Material consumption has been recorded successfully.',
          });
          if (fromTaskId) {
            router.back();
          } else {
            router.push(
              routes.resources.materialConsumptions.detail(consumption.id).href
            );
          }
        },
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Failed to Record Consumption'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Record Consumption"
        description="Log material usage or transfer"
        actions={
          <>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                fromTaskId
                  ? router.back()
                  : router.push(routes.resources.materialConsumptions.href)
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={MATERIAL_CONSUMPTION_FORM_ID}
              disabled={isPending || !currentEmployee}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Record Consumption
                </>
              )}
            </Button>
          </>
        }
      />

      {fromTaskId > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <ClipboardList className="h-4 w-4 flex-shrink-0" />
          <span>
            Recording consumption for task{' '}
            <span className="font-semibold">
              {fromTaskTitle || `#${fromTaskId}`}
            </span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Recording a consumption immediately decrements material stock. Verify
          the quantity before submitting.
        </span>
      </div>

      <MaterialConsumptionForm
        fromTaskId={fromTaskId}
        fromTaskTitle={fromTaskTitle}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
