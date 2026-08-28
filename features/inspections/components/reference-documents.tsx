'use client';

/**
 * Project documents referenced by an inspection.
 *
 * Attaching links an existing file from the project's library — nothing is
 * copied or re-uploaded, so drawings and specs keep one authoritative home.
 */

import { useMemo, useState } from 'react';
import { FileText, FolderOpen, Plus } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Separator } from '@/components/shadcn/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';
import {
  useAttachDocuments,
  useDetachDocument,
  useProjectDocuments,
} from '@/hooks/inspection';
import {
  type InspectionAttachment,
  type ProjectDocument,
  formatFileSize,
} from '@/types/inspection';

interface ReferenceDocumentsProps {
  inspectionId: number;
  projectId: number;
  documents: InspectionAttachment[];
  /** Submitted inspections are read-only. */
  disabled?: boolean;
}

export function ReferenceDocuments({
  inspectionId,
  projectId,
  documents,
  disabled = false,
}: ReferenceDocumentsProps) {
  const detachDocument = useDetachDocument();

  return (
    <Card variant="panel">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Reference Documents</h3>
          <p className="text-muted-foreground text-xs">
            Drawings and specifications from this project
          </p>
        </div>
        {!disabled && (
          <AttachDocumentsDialog
            inspectionId={inspectionId}
            projectId={projectId}
            attached={documents}
          />
        )}
      </div>

      {documents.length > 0 && <Separator />}

      {documents.length === 0 ? (
        <p className="text-muted-foreground px-5 pb-5 text-xs">
          No documents attached yet.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 px-5 py-3">
              <FileText className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {document.fileName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(document.fileSize)}
                  {document.uploadedByName && ` · ${document.uploadedByName}`}
                </p>
              </div>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={detachDocument.isPending}
                  onClick={() =>
                    detachDocument.mutate({
                      inspectionId,
                      documentId: document.id,
                    })
                  }
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

function AttachDocumentsDialog({
  inspectionId,
  projectId,
  attached,
}: {
  inspectionId: number;
  projectId: number;
  attached: InspectionAttachment[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const { data: documents = [], isLoading } = useProjectDocuments(projectId);
  const attachDocuments = useAttachDocuments();

  const attachedIds = useMemo(
    () => new Set(attached.map((item) => item.id)),
    [attached]
  );

  // Group by category so a long library stays scannable.
  const grouped = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = documents.filter(
      (document) =>
        !attachedIds.has(document.id) &&
        (term === '' || document.fileName.toLowerCase().includes(term))
    );

    const byCategory = new Map<string, ProjectDocument[]>();
    for (const document of matches) {
      const key = document.category ?? 'Other';
      byCategory.set(key, [...(byCategory.get(key) ?? []), document]);
    }
    return [...byCategory.entries()];
  }, [documents, attachedIds, query]);

  const submit = () => {
    attachDocuments.mutate(
      { inspectionId, documentIds: selected },
      {
        onSuccess: () => {
          setSelected([]);
          setQuery('');
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          Attach
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach project documents</DialogTitle>
          <DialogDescription>
            Files stay owned by the project — this inspection only references
            them.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          placeholder="Search documents…"
          onChange={(event) => setQuery(event.target.value)}
        />

        <ScrollArea className="h-72 rounded-md border">
          <PickerBody
            isLoading={isLoading}
            grouped={grouped}
            hasAnyDocuments={documents.length > 0}
            selected={selected}
            onToggle={(documentId, checked) =>
              setSelected((previous) =>
                checked
                  ? [...previous, documentId]
                  : previous.filter((id) => id !== documentId)
              )
            }
          />
        </ScrollArea>

        <DialogFooter className="items-center">
          {selected.length > 0 && (
            <Badge variant="secondary" className="mr-auto">
              {selected.length} selected
            </Badge>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0 || attachDocuments.isPending}
            onClick={submit}
          >
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Picker list body. Split out so the loading, empty and populated states are
 * early returns rather than a stack of nested ternaries inside the dialog.
 */
function PickerBody({
  isLoading,
  grouped,
  hasAnyDocuments,
  selected,
  onToggle,
}: {
  isLoading: boolean;
  grouped: [string, ProjectDocument[]][];
  hasAnyDocuments: boolean;
  selected: number[];
  onToggle: (documentId: number, checked: boolean) => void;
}) {
  if (isLoading) {
    return <p className="text-muted-foreground p-4 text-sm">Loading…</p>;
  }

  if (grouped.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <FolderOpen className="size-6" />
        <p className="text-sm">
          {hasAnyDocuments
            ? 'Nothing left to attach.'
            : 'This project has no documents yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {grouped.map(([category, items]) => (
        <div key={category} className="mb-3 last:mb-0">
          <p className="text-muted-foreground px-2 py-1 text-xs font-semibold tracking-wide uppercase">
            {category}
          </p>
          {items.map((document) => (
            <label
              key={document.id}
              className="hover:bg-muted/60 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2"
            >
              <Checkbox
                checked={selected.includes(document.id)}
                onCheckedChange={(checked) =>
                  onToggle(document.id, checked === true)
                }
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{document.fileName}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(document.fileSize)}
                </p>
              </div>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
