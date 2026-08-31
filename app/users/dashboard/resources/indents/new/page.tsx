'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Send } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useCreateIndent } from '@tornotron/echno-core/indents/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import {
  IndentForm,
  INDENT_FORM_ID,
  type IndentSubmitData,
} from '@/features/indents/components';

export default function NewIndentPage() {
  const router = useRouter();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const { mutateAsync: createIndent, isPending } = useCreateIndent();
  const clearFormDraft = useClearFormDraft();

  async function handleSubmit(data: IndentSubmitData) {
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current user.');
      return;
    }
    try {
      const indent = await createIndent({
        createdByEmployeeId: currentEmployee.id,
        status: data.form.status,
        expectedOn: data.form.expectedOn
          ? new Date(data.form.expectedOn).toISOString()
          : undefined,
        remarks: data.form.remarks.trim() || undefined,
        projectId: data.form.projectId
          ? Number(data.form.projectId)
          : undefined,
        items: data.items.map((item) => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
          additionalSpecifications:
            item.additionalSpecifications.trim() || undefined,
          remarks: item.remarks.trim() || undefined,
        })),
      });
      // The record exists now, so the local draft describes work already done.
      // Left behind it would be offered on the next visit to this form.
      clearFormDraft(FORM_DRAFT_IDS.INDENT);

      toast.success('Indent created successfully.');
      router.push(routes.resources.indents.detail(indent.id).href);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create indent.'
      );
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Create New Indent"
        description="Submit a material indent request"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.indents.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={INDENT_FORM_ID}
              disabled={isPending || !currentEmployee}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Indent
                </>
              )}
            </Button>
          </>
        }
      />
      <IndentForm onSubmit={handleSubmit} />
    </div>
  );
}
