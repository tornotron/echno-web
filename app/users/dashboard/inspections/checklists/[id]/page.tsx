'use client';

import { useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useChecklistTemplateById,
  useUpdateChecklistTemplate,
} from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  schemaToTemplateItems,
  templateItemsToSchema,
  type ChecklistSchema,
} from '@/types/inspection';
import { toast } from '@/lib/styles/toast-styles';
import { ChecklistBuilder } from '@/features/inspections/components/builder/checklist-builder';
import { useBuilderStore } from '@/features/inspections/builder/use-builder-store';

export default function ChecklistBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Template ids are UUIDs, so the route param is used as it comes.
  const { id } = use(params);
  const router = useRouter();

  const { data: template, isLoading } = useChecklistTemplateById(id);
  const updateTemplate = useUpdateChecklistTemplate();
  const load = useBuilderStore((state) => state.load);
  const markSaved = useBuilderStore((state) => state.markSaved);

  // The backend stores a flat item list, not a schema, so the builder's tree
  // is rebuilt from it on the way in and flattened again on the way out.
  const schema = useMemo(
    () =>
      template
        ? templateItemsToSchema(
            template.items,
            template.name,
            template.description
          )
        : undefined,
    [template]
  );

  // Seed the builder once per template. `load` also resets undo history, so
  // it must not re-run on every render or the first edit would be unrewindable.
  useEffect(() => {
    if (schema) load(schema);
  }, [schema, load]);

  // mutateAsync so the builder's "Save and close" can wait on the write and
  // keep the overlay open if it fails.
  const persist = async (edited: ChecklistSchema) => {
    if (!template) return;

    const items = schemaToTemplateItems(edited);
    if (items.length === 0) {
      // A template with no check points is rejected by the backend, and would
      // leave inspectors with nothing to fill in even if it were not.
      toast.error('Add at least one check point before saving');
      throw new Error('Checklist has no check points');
    }

    // The trade is required on an update and must go back unchanged, so a
    // template whose trade this build does not recognize cannot be saved
    // without inventing one. That happens only if the backend adds a trade
    // ahead of the client, and refusing is better than sending a guess that
    // would silently re-file the checklist under the wrong trade.
    if (!template.trade) {
      toast.error('This checklist uses a trade this version does not know', {
        description: 'Update the app before editing it.',
      });
      throw new Error('Checklist template has an unrecognized trade');
    }

    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        req: {
          // The trade is fixed at creation and the backend rejects a change,
          // so it is sent back exactly as it came.
          trade: template.trade,
          name: edited.title.trim() || template.name,
          description: edited.description?.trim() || undefined,
          active: template.active,
          items,
        },
      });
      markSaved();
    } catch (error) {
      toast.error('Could not save the checklist', {
        description: getErrorMessage(error),
      });
      throw error;
    }
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
              It may have been deactivated, or you may not have access to it.
            </AlertDescription>
          </Alert>
        </div>
      </BuilderOverlay>
    );
  }

  return (
    <ChecklistBuilder
      saving={updateTemplate.isPending}
      versionLabel={`v${template.version}`}
      onSave={persist}
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
