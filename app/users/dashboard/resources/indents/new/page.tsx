'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Send } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useCreateIndent } from '@/hooks/indents';
import { useCurrentUserEmployee } from '@/hooks/employee';
import {
  IndentForm,
  INDENT_FORM_ID,
  type IndentSubmitData,
} from '@/features/indents/components';

export default function NewIndentPage() {
  const router = useRouter();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const { mutateAsync: createIndent, isPending } = useCreateIndent();

  async function handleSubmit(data: IndentSubmitData) {
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current user.');
      return;
    }
    try {
      const indent = await createIndent({
        indentNumber: data.form.indentNumber.trim(),
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
      router.push(routes.resources.indents.detail(indent.id).href);
    } catch {
      // errors handled by mutation hook
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
