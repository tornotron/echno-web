'use client';

import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useDocumentIngestionStatus } from '@tornotron/echno-core/document-ingestion/hooks';
import { isModuleDisabled } from '@tornotron/echno-core/document-ingestion/services';

/**
 * Renders its children only once the backend says the module is open to the
 * organization. A 403 `MODULE_DISABLED` is an answer, so nothing renders at
 * all; any other failure says what went wrong. The route's `ModuleGuard`
 * already sends an organization without the module away, and this keeps the
 * screens dark in the window before that answer arrives, and when the
 * operator switch is off while the nav still lists the module.
 */
export function IngestionGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isError, error } = useDocumentIngestionStatus();

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading
      </div>
    );
  }
  if (isError) {
    if (isModuleDisabled(error)) return null;
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(error)}
      </p>
    );
  }
  return <>{children}</>;
}
