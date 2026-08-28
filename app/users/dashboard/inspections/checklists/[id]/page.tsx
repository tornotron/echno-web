'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import { useInspectionTemplate, useUpdateTemplate } from '@/hooks/inspection';
import { routes } from '@/nav';
import type { ChecklistSchema } from '@/types/inspection';
import { ChecklistBuilder } from '@/features/inspections/components';
import { useBuilderStore } from '@/features/inspections/builder/use-builder-store';

export default function ChecklistBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const templateId = Number(id);
  const router = useRouter();

  const { data: template, isLoading } = useInspectionTemplate(templateId);
  const updateTemplate = useUpdateTemplate();
  const load = useBuilderStore((state) => state.load);
  const markSaved = useBuilderStore((state) => state.markSaved);

  // Seed the builder once per template. `load` also resets undo history, so
  // it must not re-run on every render or the first edit would be unrewindable.
  useEffect(() => {
    if (template) load(template.schema);
  }, [template, load]);

  // mutateAsync so the builder's "Save and close" can wait on the write and
  // keep the overlay open if it fails.
  const persist = async (schema: ChecklistSchema, publish: boolean) => {
    await updateTemplate.mutateAsync({
      id: templateId,
      dto: { schema, name: schema.title, publish },
    });
    markSaved();
  };

  const close = () => router.push(routes.inspections.checklists.href);

  // Loading and error share the builder's full-screen surface so entering the
  // overlay is one transition rather than a flash of the dashboard layout.
  if (isLoading) {
    return (
      <BuilderOverlay>
        <div className="flex items-center gap-3 border-b px-3 py-2.5">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="flex min-h-0 flex-1">
          <Skeleton className="hidden w-56 rounded-none lg:block" />
          <div className="flex-1 p-6">
            <Skeleton className="mx-auto h-full max-w-3xl" />
          </div>
          <Skeleton className="hidden w-80 rounded-none lg:block" />
        </div>
      </BuilderOverlay>
    );
  }

  if (!template) {
    return (
      <BuilderOverlay>
        <div className="flex shrink-0 items-center border-b px-3 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close builder"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="size-4" />
            <AlertTitle>Checklist not found</AlertTitle>
            <AlertDescription>
              It may have been deleted, or you may not have access to it.
            </AlertDescription>
          </Alert>
        </div>
      </BuilderOverlay>
    );
  }

  return (
    <ChecklistBuilder
      saving={updateTemplate.isPending}
      versionLabel={
        template.currentVersion > 0 ? `v${template.currentVersion}` : 'Draft'
      }
      onSave={(schema) => persist(schema, false)}
      onPublish={(schema) => persist(schema, true)}
      onClose={close}
    />
  );
}

/** The builder's full-screen shell, shared by its loading and error states. */
function BuilderOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col">
      {children}
    </div>
  );
}
