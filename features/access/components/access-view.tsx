'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import {
  useAccessCatalog,
  useAccessRoles,
  useAccessUsers,
  useCurrentUserAccess,
} from '@tornotron/echno-core/access/hooks';
import {
  shownAreas,
  shownSections,
  standingOf,
  type PermissionMap,
} from '../lib/permissions';
import { ConfirmDialog } from './confirm-dialog';
import { RolesTab } from './roles-tab';
import { UsersTab } from './users-tab';

type Tier = 'roles' | 'users';

interface AccessViewProps {
  /** Told whenever the screen gains or loses unsaved edits, so the page can ask before leaving. */
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * The Roles & Permissions screen, in two tabs. Roles: the roles by modules
 * matrix, with the selected role's Module Permissions and Assigned Users on
 * its right. Users: everyone and the roles they hold, with the selected
 * person on the right. Only what the backend enforces is offered. Switching
 * tab, person, or leaving the page with unsaved edits asks first.
 */
export function AccessView({ onDirtyChange }: AccessViewProps) {
  const catalogQuery = useAccessCatalog();
  const rolesQuery = useAccessRoles();
  const usersQuery = useAccessUsers();
  const { access, isLoading: accessLoading } = useCurrentUserAccess();
  const catalog = catalogQuery.data;
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const standing = useMemo(
    () => standingOf(access, users, roles),
    [access, users, roles]
  );
  const areas = useMemo(() => shownAreas(catalog), [catalog]);
  const sections = useMemo(
    () => shownSections(catalog, areas),
    [catalog, areas]
  );

  const [tier, setTier] = useState<Tier>('roles');
  const [draft, setDraft] = useState<Record<string, PermissionMap>>({});
  const [personId, setPersonId] = useState<number | null>(null);
  const [personDirty, setPersonDirty] = useState(false);
  /** A move held back until the user agrees to drop their edits. */
  const [pending, setPending] = useState<(() => void) | null>(null);
  const dirty = Object.keys(draft).length > 0 || personDirty;

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /** Runs `go` now, or after a "discard changes?" confirm when there are edits. */
  const guard = (go: () => void) => {
    if (dirty) setPending(() => go);
    else go();
  };

  const isLoading =
    accessLoading ||
    catalogQuery.isLoading ||
    rolesQuery.isLoading ||
    usersQuery.isLoading;
  const isError =
    catalogQuery.isError || rolesQuery.isError || usersQuery.isError;

  if (isLoading)
    return (
      <Card className="flex items-center justify-center py-16">
        <Loader2
          className="h-8 w-8 animate-spin text-zinc-400"
          aria-label="Loading roles and permissions"
        />
      </Card>
    );

  if (isError || !catalog)
    return (
      <Card className="py-12">
        <Empty variant="default">
          <EmptyErrorMedia>
            <ShieldCheck className="size-6" />
          </EmptyErrorMedia>
          <EmptyHeader>
            <EmptyTitle>Failed to load roles and permissions</EmptyTitle>
            <EmptyDescription>
              An unexpected error occurred. Please try again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Tabs
          value={tier}
          onValueChange={(v) =>
            guard(() => {
              setDraft({});
              setPersonDirty(false);
              setPersonId(null);
              setTier(v as Tier);
            })
          }
        >
          <TabsList variant="line">
            <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        {!standing.canEdit && (
          <span className="ml-auto text-xs text-zinc-500">
            You can see roles and who holds them, but not change them.
          </span>
        )}
      </div>

      {tier === 'roles' && (
        <RolesTab
          catalog={catalog}
          areas={areas}
          sections={sections}
          roles={roles}
          users={users}
          standing={standing}
          draft={draft}
          onDraftChange={setDraft}
        />
      )}
      {tier === 'users' && (
        <UsersTab
          users={users}
          roles={roles}
          standing={standing}
          selectedId={personId}
          onSelect={(id) =>
            guard(() => {
              setPersonDirty(false);
              setPersonId(id);
            })
          }
          onDirtyChange={setPersonDirty}
        />
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Discard unsaved changes?"
        description="You have edits that have not been saved. Leaving now will drop them."
        confirmLabel="Discard"
        onConfirm={() => {
          const go = pending;
          setPending(null);
          setDraft({});
          setPersonDirty(false);
          go?.();
        }}
      />
    </Card>
  );
}
