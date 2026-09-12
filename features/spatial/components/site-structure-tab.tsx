'use client';

import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Upload,
} from 'lucide-react';
import type {
  SpatialLevel,
  SpatialTreeNode,
} from '@tornotron/echno-core/spatial/types';
import {
  childSpatialLevel,
  spatialLevelLabels,
} from '@tornotron/echno-core/spatial/types';
import {
  useArchiveSpatialNode,
  useCreateSpatialNode,
  useImportSpatialRows,
  useRestoreSpatialNode,
  useSpatialTree,
  useUpdateSpatialNode,
} from '@tornotron/echno-core/spatial/hooks';
import { getErrorMessage } from '@tornotron/echno-core';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { toast } from '@/lib/styles/toast-styles';
import { cn } from '@/lib/utils/index';
import { parseSpatialImportText } from '../lib/import-rows';

interface SiteStructureTabProps {
  projectId: number;
}

// ---------------------------------------------------------------------------
// Inline add / rename editors
// ---------------------------------------------------------------------------

interface NodeEditorProps {
  level: SpatialLevel;
  initial?: { code: string; name: string; levelIndex?: number; elementType?: string };
  busy: boolean;
  onSubmit: (values: {
    code: string;
    name: string;
    levelIndex?: number;
    elementType?: string;
  }) => void;
  onCancel: () => void;
}

function NodeEditor({ level, initial, busy, onSubmit, onCancel }: NodeEditorProps) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [levelIndex, setLevelIndex] = useState(
    initial?.levelIndex === undefined ? '' : String(initial.levelIndex)
  );
  const [elementType, setElementType] = useState(initial?.elementType ?? '');
  const label = spatialLevelLabels[level].toLowerCase();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const parsed = levelIndex.trim() === '' ? undefined : Number(levelIndex);
    onSubmit({
      code: code.trim(),
      name: name.trim() || code.trim(),
      levelIndex: parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined,
      elementType: elementType.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-zinc-300 p-2 dark:border-zinc-700"
      aria-label={`${initial ? 'Rename' : 'Add'} ${label}`}
    >
      <div className="space-y-1">
        <Label htmlFor={`code-${level}`}>Code</Label>
        <Input
          id={`code-${level}`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={level === 'FLOOR' ? 'L03' : level === 'ELEMENT' ? 'C4' : 'B1'}
          className="h-8 w-28"
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`name-${level}`}>Name</Label>
        <Input
          id={`name-${level}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
          className="h-8 w-44"
        />
      </div>
      {level === 'FLOOR' && (
        <div className="space-y-1">
          <Label htmlFor="levelIndex">Level index</Label>
          <Input
            id="levelIndex"
            value={levelIndex}
            onChange={(e) => setLevelIndex(e.target.value)}
            placeholder="0 = ground"
            className="h-8 w-24"
            inputMode="numeric"
          />
        </div>
      )}
      {level === 'ELEMENT' && (
        <div className="space-y-1">
          <Label htmlFor="elementType">Type</Label>
          <Input
            id="elementType"
            value={elementType}
            onChange={(e) => setElementType(e.target.value)}
            placeholder="column"
            className="h-8 w-28"
          />
        </div>
      )}
      <Button type="submit" size="sm" disabled={busy || !code.trim()}>
        {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
        {initial ? 'Save' : `Add ${label}`}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tree rows
// ---------------------------------------------------------------------------

interface NodeRowProps {
  node: SpatialTreeNode;
  depth: number;
  projectId: number;
  showArchived: boolean;
}

const fail = (error: unknown) => toast.error(getErrorMessage(error));

function NodeRow({ node, depth, projectId, showArchived }: NodeRowProps) {
  const [open, setOpen] = useState(depth < 2);
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const create = useCreateSpatialNode(projectId);
  const update = useUpdateSpatialNode(projectId);
  const archive = useArchiveSpatialNode(projectId);
  const restore = useRestoreSpatialNode(projectId);
  const childLevel = childSpatialLevel(node.level);
  const children = node.children.filter((c) => showArchived || !c.archivedAt);
  const archived = !!node.archivedAt;

  return (
    <li data-testid={`spatial-node-${node.code}`}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
          archived && 'opacity-60'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          type="button"
          className="text-zinc-400"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse' : 'Expand'}
          disabled={children.length === 0}
        >
          {children.length === 0 ? (
            <span className="inline-block h-4 w-4" />
          ) : open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Badge variant="outline" className="text-[10px] uppercase">
          {spatialLevelLabels[node.level]}
        </Badge>
        <span className="font-medium">{node.code}</span>
        {node.name && node.name !== node.code && (
          <span className="text-muted-foreground text-sm">{node.name}</span>
        )}
        {node.level === 'FLOOR' && node.levelIndex !== undefined && (
          <span className="text-muted-foreground text-xs">
            idx {node.levelIndex}
          </span>
        )}
        {node.elementType && (
          <span className="text-muted-foreground text-xs">{node.elementType}</span>
        )}
        {archived && (
          <Badge variant="secondary" className="text-[10px]">
            Archived
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-1">
          {!archived && childLevel && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => setAdding(true)}
              aria-label={`Add ${spatialLevelLabels[childLevel].toLowerCase()} under ${node.code}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          {!archived && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => setRenaming(true)}
              aria-label={`Rename ${node.code}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {archived ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              disabled={restore.isPending}
              onClick={() =>
                restore.mutate(node.id, {
                  onSuccess: () => toast.success(`${node.code} restored`),
                  onError: fail,
                })
              }
              aria-label={`Restore ${node.code}`}
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              disabled={archive.isPending}
              onClick={() =>
                archive.mutate(node.id, {
                  onSuccess: () => toast.success(`${node.code} archived`),
                  onError: fail,
                })
              }
              aria-label={`Archive ${node.code}`}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
        </span>
      </div>
      {renaming && (
        <div style={{ paddingLeft: `${depth * 20 + 32}px` }} className="py-1">
          <NodeEditor
            level={node.level}
            initial={{
              code: node.code,
              name: node.name,
              levelIndex: node.levelIndex,
              elementType: node.elementType,
            }}
            busy={update.isPending}
            onCancel={() => setRenaming(false)}
            onSubmit={(values) =>
              update.mutate(
                { nodeId: node.id, data: values },
                {
                  onSuccess: () => setRenaming(false),
                  onError: fail,
                }
              )
            }
          />
        </div>
      )}
      {adding && childLevel && (
        <div style={{ paddingLeft: `${depth * 20 + 32}px` }} className="py-1">
          <NodeEditor
            level={childLevel}
            busy={create.isPending}
            onCancel={() => setAdding(false)}
            onSubmit={(values) =>
              create.mutate(
                { level: childLevel, parentId: node.id, ...values },
                {
                  onSuccess: () => {
                    setAdding(false);
                    setOpen(true);
                  },
                  onError: fail,
                }
              )
            }
          />
        </div>
      )}
      {open && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              projectId={projectId}
              showArchived={showArchived}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

function ImportPanel({ projectId }: { projectId: number }) {
  const [text, setText] = useState('');
  const importRows = useImportSpatialRows(projectId);
  const parsed = parseSpatialImportText(text);

  const run = () => {
    if (parsed.rows.length === 0) return;
    importRows.mutate(
      { rows: parsed.rows },
      {
        onSuccess: (result) => {
          toast.success(
            `Imported ${result.created} node${result.created === 1 ? '' : 's'}, ${result.skipped} already there`
          );
          setText('');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Import from a spreadsheet
        </CardTitle>
        <CardDescription>
          Paste rows as CSV or straight from a sheet. Columns: building, floor,
          zone, element, levelIndex, elementType (a header line is optional).
          Rows already in the tree are skipped, so the same paste can be
          repeated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          aria-label="Import rows"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'building,floor,zone,element,levelIndex,elementType\nB1,L03,Z1,C4,3,column'}
          rows={6}
          className="font-mono text-xs"
        />
        {parsed.errors.length > 0 && (
          <ul className="text-sm text-red-600">
            {parsed.errors.slice(0, 5).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={run}
            disabled={parsed.rows.length === 0 || importRows.isPending}
          >
            {importRows.isPending && (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            )}
            Import {parsed.rows.length > 0 ? `${parsed.rows.length} rows` : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

/**
 * The project's `Building > Floor > Zone > Element` tree with add, rename,
 * archive and restore per node, and a paste-to-import panel. Core feature,
 * every tenant: the tree is where inspections, defects and BIM point.
 */
export function SiteStructureTab({ projectId }: SiteStructureTabProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [addingBuilding, setAddingBuilding] = useState(false);
  const { data: tree = [], isPending, error } = useSpatialTree(
    projectId,
    showArchived
  );
  const create = useCreateSpatialNode(projectId);
  const buildings = tree.filter((b) => showArchived || !b.archivedAt);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Site structure</CardTitle>
            <CardDescription>
              Buildings, floors, zones and elements. Inspections and defects
              are placed on these; archiving keeps old references readable.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => setAddingBuilding(true)}
              disabled={addingBuilding}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add building
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addingBuilding && (
            <div className="mb-3">
              <NodeEditor
                level="BUILDING"
                busy={create.isPending}
                onCancel={() => setAddingBuilding(false)}
                onSubmit={(values) =>
                  create.mutate(
                    { level: 'BUILDING', ...values },
                    {
                      onSuccess: () => setAddingBuilding(false),
                      onError: (e) => toast.error(getErrorMessage(e)),
                    }
                  )
                }
              />
            </div>
          )}
          {isPending ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading site structure
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
          ) : buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No buildings yet. Add one above, or paste rows below to import a
              whole structure.
            </p>
          ) : (
            <ul data-testid="spatial-tree">
              {buildings.map((building) => (
                <NodeRow
                  key={building.id}
                  node={building}
                  depth={0}
                  projectId={projectId}
                  showArchived={showArchived}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ImportPanel projectId={projectId} />
    </div>
  );
}
