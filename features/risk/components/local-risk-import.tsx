'use client';

import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useImportRisks } from '@tornotron/echno-core/risk/hooks';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { toast } from '@/lib/styles/toast-styles';
import {
  clearLocalRisks,
  readLocalRisks,
  toImportRequests,
} from '../lib/local-risks';

interface LocalRiskImportProps {
  projectId: number;
  /** Whether the viewer may add risks: system-admin or project-manager. */
  canWrite: boolean;
}

/**
 * Offers, once, the risks this browser kept for the project before the
 * register moved to the server. After they are imported (or discarded) the
 * local copy is removed and the notice does not come back.
 */
export function LocalRiskImport({ projectId, canWrite }: LocalRiskImportProps) {
  const [entries, setEntries] = useState(() => readLocalRisks(projectId));
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const importRisks = useImportRisks(projectId);

  if (entries.length === 0) return null;
  const count = entries.length;
  const noun = count === 1 ? 'risk' : 'risks';

  const handleImport = () => {
    importRisks.mutate(toImportRequests(entries), {
      onSuccess: (added) => {
        clearLocalRisks(projectId);
        setEntries([]);
        const skipped = count - added.length;
        toast.success(
          `Imported ${added.length} ${added.length === 1 ? 'risk' : 'risks'}`,
          {
            description:
              skipped > 0
                ? `${skipped} were already on the register and were skipped.`
                : 'Everyone on the project can see them now.',
          }
        );
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Import Failed'), {
          description: `${getErrorMessage(error)} Nothing was removed from this browser, so you can try again.`,
        }),
    });
  };

  const handleDiscard = () => {
    clearLocalRisks(projectId);
    setEntries([]);
  };

  return (
    <Alert>
      <Upload className="h-4 w-4" />
      <AlertTitle>
        This browser has {count} {noun} saved for this project before the
        register was shared
      </AlertTitle>
      <AlertDescription>
        <p>
          The Risk Register used to keep risks only in the browser of the person
          who entered them. It is now saved on the server, so everyone on the
          project sees the same register.{' '}
          {canWrite
            ? `Import ${count === 1 ? 'it' : 'them'} to add ${count === 1 ? 'it' : 'them'} to the shared register.`
            : 'Only a system admin or a project manager can add risks, so ask one of them to record these, or open this page as one.'}
        </p>
        {canWrite && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importRisks.isPending}
            >
              {importRisks.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Import {count} {noun}
            </Button>
            {confirmDiscard ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDiscard}
                  disabled={importRisks.isPending}
                >
                  Yes, discard them
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDiscard(false)}
                >
                  Keep them
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDiscard(true)}
                disabled={importRisks.isPending}
              >
                Discard
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
