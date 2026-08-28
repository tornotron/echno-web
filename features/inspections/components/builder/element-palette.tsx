'use client';

import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { cn } from '@/lib/utils/index';
import type { ElementType } from '@/types/inspection';
import {
  ELEMENT_GROUPS,
  ELEMENT_GROUP_LABELS,
  elementsInGroup,
} from '../../builder/element-registry';
import type { ElementDefinition } from '../../builder/types';

interface ElementPaletteProps {
  /** Click-to-add — the keyboard and touch path to the same outcome as dragging. */
  onAdd: (type: ElementType) => void;
}

export function ElementPalette({ onAdd }: ElementPaletteProps) {
  const [query, setQuery] = useState('');

  // Seventeen element types is more than anyone scans comfortably, and the
  // author usually knows the name of the one they want.
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return ELEMENT_GROUPS.map((group) => ({
      group,
      definitions: elementsInGroup(group).filter(
        (definition) =>
          needle === '' ||
          definition.label.toLowerCase().includes(needle) ||
          definition.type.toLowerCase().includes(needle)
      ),
    })).filter((entry) => entry.definitions.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative shrink-0 p-3 pb-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-5 size-3.5 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search elements…"
          aria-label="Search elements"
          className="h-8 pl-7 text-sm"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-3">
          {groups.length === 0 ? (
            <p className="text-muted-foreground px-1 py-6 text-center text-xs">
              No elements match “{query}”.
            </p>
          ) : (
            groups.map(({ group, definitions }) => (
              <div key={group} className="space-y-1.5">
                <p className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
                  {ELEMENT_GROUP_LABELS[group]}
                </p>
                <div className="space-y-1">
                  {definitions.map((definition) => (
                    <PaletteItem
                      key={definition.type}
                      definition={definition}
                      onAdd={onAdd}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function PaletteItem({
  definition,
  onAdd,
}: {
  definition: ElementDefinition;
  onAdd: (type: ElementType) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { kind: 'palette', elementType: definition.type },
  });

  const Icon = definition.icon;

  return (
    <Button
      ref={setNodeRef}
      type="button"
      variant="ghost"
      onClick={() => onAdd(definition.type)}
      className={cn(
        'h-9 w-full cursor-grab justify-start gap-2.5 px-2 font-normal active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
      {...listeners}
      {...attributes}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="truncate text-sm">{definition.label}</span>
    </Button>
  );
}
