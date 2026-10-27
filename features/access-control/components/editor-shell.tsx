'use client';

import type { ReactNode } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

interface EditorShellProps {
  header: ReactNode;
  /** Membership rows, between the header and the permissions. */
  members?: ReactNode;
  children: ReactNode;
  dirty: boolean;
  saving: boolean;
  saveLabel?: string;
  onSave: () => void;
  onDiscard: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}

/** The right pane: header, members, permissions, and a save bar that appears on edit. */
export function EditorShell({
  header,
  members,
  children,
  dirty,
  saving,
  saveLabel = 'Save changes',
  onSave,
  onDiscard,
  onDelete,
  deleteLabel = 'Delete',
}: EditorShellProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="space-y-4 border-b p-4 sm:p-6">
        {header}
        {members && <div className="space-y-2.5">{members}</div>}
      </div>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
      <div className="bg-card/95 sticky bottom-0 flex items-center gap-2 border-t px-4 py-3 backdrop-blur sm:px-6">
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
          >
            <Trash2 className="mr-1.5 size-4" />
            {deleteLabel}
          </Button>
        )}
        <span className="ml-auto text-xs text-zinc-500" aria-live="polite">
          {dirty ? 'Unsaved changes' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          disabled={!dirty || saving}
        >
          Discard
        </Button>
        <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
