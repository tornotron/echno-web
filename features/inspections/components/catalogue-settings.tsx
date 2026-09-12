'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type {
  CatalogueEntry,
  CreateCatalogueRowRequest,
  OrgCatalogueRow,
  UpdateCatalogueRowRequest,
} from '@tornotron/echno-core/inspection/types';
import {
  catalogueGroupLabel,
  groupCatalogueRows,
} from '@tornotron/echno-core/inspection/types';
import {
  useCreateElementType,
  useCreateTrade,
  useElementTypeCatalogue,
  useOrgElementTypes,
  useOrgTrades,
  useTradeCatalogue,
  useUpdateElementType,
  useUpdateTrade,
} from '@tornotron/echno-core/inspection/hooks';
import { getErrorMessage } from '@tornotron/echno-core';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Switch } from '@/components/shadcn/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';

const CODE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A name as a code: lowercase, runs of anything else collapsed to one hyphen. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

type UpdateVars = { id: string; data: UpdateCatalogueRowRequest };

interface CatalogueSettingsProps {
  /** Singular noun for copy: "trade", "element type". */
  noun: string;
  /** What a row's code is used for, shown under the add form. */
  codeHint: string;
  rows: UseQueryResult<OrgCatalogueRow[]>;
  catalogue: UseQueryResult<CatalogueEntry[]>;
  create: UseMutationResult<OrgCatalogueRow, Error, CreateCatalogueRowRequest>;
  update: UseMutationResult<OrgCatalogueRow, Error, UpdateVars>;
}

/**
 * One management tab for an organization catalogue: every row the
 * organization has (catalogue copies and its own), grouped, with an active
 * switch, an add form for org-defined rows, and the product catalogue rows
 * the organization is missing, offered for restoring. Rows are deactivated,
 * never deleted: an inactive row leaves the pickers and stays valid wherever
 * it is referenced.
 */
export function CatalogueSettings({
  noun,
  codeHint,
  rows,
  catalogue,
  create,
  update,
}: CatalogueSettingsProps) {
  const all = useMemo(() => rows.data ?? [], [rows.data]);
  const groups = useMemo(() => groupCatalogueRows(all, true), [all]);

  // Catalogue codes with no row in the organization. `ensureOrgTrades` copies
  // the whole catalogue on first read, so this is normally empty; it fills
  // when the product ships a new code before the copy step has run.
  const missing = useMemo(() => {
    const have = new Set(all.map((row) => row.catalogueCode ?? row.code));
    return (catalogue.data ?? []).filter(
      (entry) => entry.active && !have.has(entry.code)
    );
  }, [all, catalogue.data]);

  const setActive = (row: OrgCatalogueRow, active: boolean) =>
    update.mutate(
      { id: row.id, data: { active } },
      {
        onSuccess: () =>
          toast.success(
            active ? `${row.name} enabled` : `${row.name} disabled`
          ),
        onError: (error) =>
          toast.error(`Could not update the ${noun}`, {
            description: getErrorMessage(error),
          }),
      }
    );

  const restore = (entry: CatalogueEntry) =>
    create.mutate(
      {
        code: entry.code,
        name: entry.name,
        groupCode: entry.groupCode,
        description: entry.description,
        sortOrder: entry.sortOrder,
      },
      {
        onSuccess: () => toast.success(`${entry.name} restored`),
        onError: (error) =>
          toast.error(`Could not restore the ${noun}`, {
            description: getErrorMessage(error),
          }),
      }
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {`${all.filter((row) => row.active).length} active of ${all.length} ${noun}s. `}
          Disabling one removes it from pickers without touching what already
          references it.
        </p>
        <AddRowDialog
          noun={noun}
          codeHint={codeHint}
          existingCodes={new Set(all.map((row) => row.code))}
          create={create}
        />
      </div>

      {rows.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <GroupRows
                  key={group.groupCode}
                  label={catalogueGroupLabel(group.groupCode)}
                  rows={group.rows}
                  onToggle={setActive}
                  busy={update.isPending}
                />
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No {noun}s yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {missing.length > 0 && (
        <Card variant="panel" className="space-y-2 p-4">
          <p className="text-sm font-medium">From the product catalogue</p>
          <p className="text-muted-foreground text-xs">
            These {noun}s ship with the product and are not in your list yet.
          </p>
          <ul className="flex flex-wrap gap-2">
            {missing.map((entry) => (
              <li key={entry.code}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={create.isPending}
                  onClick={() => restore(entry)}
                >
                  <Plus className="size-3.5" />
                  {entry.name}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function GroupRows({
  label,
  rows,
  onToggle,
  busy,
}: {
  label: string;
  rows: OrgCatalogueRow[];
  onToggle: (row: OrgCatalogueRow, active: boolean) => void;
  busy: boolean;
}) {
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell
          colSpan={4}
          className="text-muted-foreground text-xs font-medium uppercase"
        >
          {label}
        </TableCell>
      </TableRow>
      {rows.map((row) => (
        <TableRow key={row.id} data-testid={`catalogue-row-${row.code}`}>
          <TableCell className={row.active ? '' : 'text-muted-foreground'}>
            {row.name}
            {row.description && (
              <span className="text-muted-foreground block text-xs">
                {row.description}
              </span>
            )}
          </TableCell>
          <TableCell className="font-mono text-xs">{row.code}</TableCell>
          <TableCell>
            <Badge variant="outline">
              {row.catalogueCode ? 'Catalogue' : 'Your organisation'}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <Switch
              aria-label={`${row.name} active`}
              checked={row.active}
              disabled={busy}
              onCheckedChange={(checked) => onToggle(row, checked)}
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function AddRowDialog({
  noun,
  codeHint,
  existingCodes,
  create,
}: {
  noun: string;
  codeHint: string;
  existingCodes: ReadonlySet<string>;
  create: CatalogueSettingsProps['create'];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [description, setDescription] = useState('');

  let codeError: string | undefined;
  if (code !== '' && !CODE.test(code)) {
    codeError = 'Lowercase letters, digits and hyphens only';
  } else if (existingCodes.has(code)) {
    codeError = `A ${noun} with this code already exists`;
  }

  const reset = () => {
    setName('');
    setCode('');
    setCodeTouched(false);
    setGroupCode('');
    setDescription('');
  };

  const submit = () =>
    create.mutate(
      {
        code,
        name: name.trim(),
        groupCode: slug(groupCode) || 'general',
        description: description.trim() || undefined,
      },
      {
        onSuccess: (row) => {
          toast.success(`${row.name} added`);
          setOpen(false);
          reset();
        },
        onError: (error) =>
          toast.error(`Could not add the ${noun}`, {
            description: getErrorMessage(error),
          }),
      }
    );

  const canSubmit =
    name.trim() !== '' && code !== '' && !codeError && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add {noun}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New {noun}</DialogTitle>
          <DialogDescription>
            Defined by your organisation and available at once in pickers. The
            code is fixed once created.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`new-${noun}-name`}>Name</Label>
            <Input
              id={`new-${noun}-name`}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!codeTouched) setCode(slug(event.target.value));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`new-${noun}-code`}>Code</Label>
            <Input
              id={`new-${noun}-code`}
              value={code}
              className="font-mono"
              onChange={(event) => {
                setCodeTouched(true);
                setCode(event.target.value);
              }}
            />
            <p
              className={
                codeError
                  ? 'text-xs text-red-500'
                  : 'text-muted-foreground text-xs'
              }
            >
              {codeError ?? codeHint}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`new-${noun}-group`}>Group</Label>
            <Input
              id={`new-${noun}-group`}
              value={groupCode}
              placeholder="e.g. structural"
              onChange={(event) => setGroupCode(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              The heading it is listed under. Any word; blank files it under
              General.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`new-${noun}-description`}>Description</Label>
            <Textarea
              id={`new-${noun}-description`}
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {create.isPending ? 'Adding…' : `Add ${noun}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The Trades tab: the organization's inspection trades. */
export function TradeSettingsTab() {
  return (
    <CatalogueSettings
      noun="trade"
      codeHint="The value an inspection or checklist carries as its trade."
      rows={useOrgTrades(true)}
      catalogue={useTradeCatalogue()}
      create={useCreateTrade()}
      update={useUpdateTrade()}
    />
  );
}

/** The Element types tab: what a site structure element can be typed as. */
export function ElementTypeSettingsTab() {
  return (
    <CatalogueSettings
      noun="element type"
      codeHint="The value a site structure element carries as its type."
      rows={useOrgElementTypes(true)}
      catalogue={useElementTypeCatalogue()}
      create={useCreateElementType()}
      update={useUpdateElementType()}
    />
  );
}
