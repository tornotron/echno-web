'use client';

import { useState } from 'react';
import { Database } from 'lucide-react';
import {
  useDatasetConsent,
  useSetDatasetConsent,
} from '@tornotron/echno-core/organization/hooks';
import { ApiError } from '@/lib/api/api-client';
import { useAuthorization } from '@/hooks/use-authorization';
import { Badge } from '@/components/shadcn/badge';
import { Switch } from '@/components/shadcn/switch';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { toast } from '@/lib/styles/toast-styles';
import { userFacingErrorMessage } from '@/lib/utils/api-utils';

/**
 * What an organization admin agrees to when the flag goes on. Plain
 * language, matching the dataset design note: what is exported, that
 * people and vehicles are blurred, where it goes, and that it can be
 * withdrawn.
 */
export const DATASET_CONSENT_POINTS: readonly string[] = [
  'Photos and documents attached to your inspections as evidence, and the boxes your inspectors drew on defect photos, are copied into a construction image dataset that trains Echno detection models.',
  'Faces and vehicle number plates are blurred before a copy leaves your account. Any photo the blurring step cannot process is left out. The originals in your account are never changed.',
  'The copies are stored in a dataset bucket managed by Fereydon, tagged with your organization as the consenting source, and used for model training and evaluation.',
  'You can withdraw at any time by switching this off. From then on the export job leaves your organization out.',
];

/** The 403 the backend returns to anyone without the system-admin role. */
function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function DatasetConsentSetting({
  organizationId,
}: {
  organizationId: number;
}) {
  const { isSystemAdmin, isLoading: rolesLoading } = useAuthorization();
  const consent = useDatasetConsent(organizationId);
  const setConsent = useSetDatasetConsent();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const current = consent.data?.datasetConsent ?? false;
  const canChange = isSystemAdmin && !rolesLoading && consent.isSuccess;

  const apply = async (datasetConsent: boolean) => {
    try {
      await setConsent.mutateAsync({
        id: organizationId,
        data: { datasetConsent },
      });
      toast.success(
        datasetConsent
          ? 'Dataset consent recorded'
          : 'Dataset consent withdrawn'
      );
    } catch (error) {
      toast.error(
        userFacingErrorMessage(error, 'The setting could not be saved.')
      );
    }
  };

  const onToggle = (next: boolean) => {
    if (!canChange) return;
    if (next) {
      // Giving consent is the step that needs a read-through; withdrawing
      // is one click, since it only ever removes the organization.
      setConfirmOpen(true);
      return;
    }
    void apply(false);
  };

  return (
    <div
      data-testid="dataset-consent-setting"
      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
            <Database className="h-4 w-4" />
            Construction image dataset
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Allow anonymised inspection evidence from this organization to be
            exported into the dataset that trains Echno detection models.
            Off by default; only a system administrator can change it.
          </p>
        </div>
        {consent.isPending ? (
          <Skeleton className="h-6 w-11 rounded-full" />
        ) : consent.isError && isForbidden(consent.error) ? (
          <Badge variant="outline">Admin only</Badge>
        ) : consent.isError ? (
          <Badge variant="outline">Unavailable</Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={current ? 'default' : 'secondary'}>
              {current ? 'Consented' : 'Not consented'}
            </Badge>
            <Switch
              aria-label="Dataset consent"
              checked={current}
              disabled={!canChange || setConsent.isPending}
              onCheckedChange={onToggle}
            />
          </div>
        )}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        {DATASET_CONSENT_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record dataset consent?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This records that your organization has agreed, in
                  writing, to the following. Switch it on only once that
                  written agreement exists.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {DATASET_CONSENT_POINTS.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void apply(true);
              }}
            >
              Record consent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
