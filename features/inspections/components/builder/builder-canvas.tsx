'use client';

import { useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Copy, GitBranch, GripVertical, Trash2 } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';
import { cn } from '@/lib/utils/index';
import type { ChecklistElement, ChecklistSchema } from '@/types/inspection';
import { definitionFor } from '../../builder/element-registry';

/** Droppable id prefix for a section's own child area. */
export const SECTION_DROP_PREFIX = 'section-drop-';
export const CANVAS_ROOT_ID = 'canvas-root';

interface BuilderCanvasProps {
  schema: ChecklistSchema;
  selectedElementId?: string;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BuilderCanvas({
  schema,
  selectedElementId,
  onSelect,
  onDuplicate,
  onDelete,
}: BuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_ROOT_ID });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mx-auto min-h-full w-full max-w-5xl space-y-3 rounded-lg p-4 transition-colors sm:p-6',
        isOver && 'bg-sidebar-accent/30'
      )}
    >
      {schema.elements.length === 0 ? (
        <EmptyCanvas />
      ) : (
        schema.elements.map((element) => (
          <CanvasNode
            key={element.id}
            element={element}
            selectedElementId={selectedElementId}
            onSelect={onSelect}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="border-muted-foreground/25 text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm font-medium">Your checklist is empty</p>
      <p className="text-xs">
        Drag an element from the palette, or click one to add it.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

interface CanvasNodeProps {
  element: ChecklistElement;
  selectedElementId?: string;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function CanvasNode(props: CanvasNodeProps) {
  return props.element.type === 'section' ? (
    <SectionNode {...props} />
  ) : (
    <ElementNode {...props} />
  );
}

/**
 * A canvas item is simultaneously draggable (to move it) and droppable
 * (as a drop anchor for whatever is being dragged over it).
 */
function useCanvasItem(id: string) {
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({ id, data: { kind: 'element', id } });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  return { setNodeRef, listeners, attributes, isDragging, isOver };
}

/**
 * The two properties you cannot see by looking at a rendered field.
 *
 * Required-ness and a visibility rule both change what an inspection actually
 * demands, but neither shows up in the inert preview — without these the only
 * way to audit a long checklist is to select every row in turn.
 */
function ElementMarkers({ element }: { element: ChecklistElement }) {
  const conditional = (element.visibility?.when.length ?? 0) > 0;
  if (!element.required && !conditional) return null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      {element.required && (
        <Badge variant="secondary" className="text-[10px]">
          Required
        </Badge>
      )}
      {conditional && (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <GitBranch className="size-3" />
          Conditional
        </Badge>
      )}
    </div>
  );
}

/** Canvas fields are inert; the registry contract still requires onChange. */
const noop = () => {
  // Intentionally empty — the builder canvas never records responses.
};

/**
 * Row chrome: a drag gutter on the left, the element body in the middle, and
 * the duplicate/delete gutter on the right.
 *
 * The gutters are always in the flow (only their contents fade in), so the
 * body never changes width on hover and the controls never sit on top of the
 * element's own content.
 */
function ItemChrome({
  selected,
  isDragging,
  isOver,
  onSelect,
  onDuplicate,
  onDelete,
  listeners,
  attributes,
  children,
  className,
}: {
  selected: boolean;
  isDragging: boolean;
  isOver: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  listeners: ReturnType<typeof useDraggable>['listeners'];
  attributes: ReturnType<typeof useDraggable>['attributes'];
  children: React.ReactNode;
  className?: string;
}) {
  // Controls stay visible while the row is selected — that is the row you are
  // acting on, so hunting for its buttons with the pointer is needless work.
  //
  // A coarse pointer has no hover to reveal them with, so on touch they are
  // always visible: reveal-on-hover would leave the drag handle and the
  // duplicate/delete buttons unreachable on a tablet.
  const gutterVisibility = cn(
    'transition-opacity',
    selected
      ? 'opacity-100'
      : 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100'
  );

  return (
    <div
      className={cn(
        'group/row flex items-start gap-1',
        isDragging && 'opacity-40'
      )}
    >
      {/* ── Drag gutter ─────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Drag to reorder"
        // `touch-none` stops the browser claiming the gesture as a scroll
        // before the TouchSensor's press delay elapses — without it the handle
        // is inert on touch no matter which sensor is registered.
        className={cn(
          'text-muted-foreground hover:text-foreground hover:bg-muted mt-1.5 block shrink-0 cursor-grab touch-none rounded-md p-1.5 active:cursor-grabbing',
          gutterVisibility
        )}
        onClick={(event) => event.stopPropagation()}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        // Elements nest inside sections, so the click must stop here. Without
        // this it bubbles to the parent section's handler, which re-selects
        // the section and makes children impossible to select.
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }
        }}
        className={cn(
          'min-w-0 flex-1 rounded-lg text-left transition-all',
          'ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          selected ? 'ring-primary ring-2' : 'hover:ring-border hover:ring-1',
          isOver && 'ring-primary/50 ring-2',
          className
        )}
      >
        {children}
      </div>

      {/* ── Actions gutter ──────────────────────────────────────────────── */}
      <div className={cn('mt-1 flex shrink-0 items-center', gutterVisibility)}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Duplicate element"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive size-8"
          aria-label="Delete element"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ElementNode({
  element,
  selectedElementId,
  onSelect,
  onDuplicate,
  onDelete,
}: CanvasNodeProps) {
  const { setNodeRef, listeners, attributes, isDragging, isOver } =
    useCanvasItem(element.id);
  const { Field } = definitionFor(element.type);

  return (
    <div ref={setNodeRef}>
      <ItemChrome
        selected={selectedElementId === element.id}
        isDragging={isDragging}
        isOver={isOver}
        onSelect={() => onSelect(element.id)}
        onDuplicate={() => onDuplicate(element.id)}
        onDelete={() => onDelete(element.id)}
        listeners={listeners}
        attributes={attributes}
        className="bg-card border p-4"
      >
        {/* Controls are inert on the canvas — editing happens in Properties. */}
        <div className="pointer-events-none">
          <ElementMarkers element={element} />
          <Field
            element={element}
            value={element.defaultValue}
            disabled
            onChange={noop}
          />
        </div>
      </ItemChrome>
    </div>
  );
}

function SectionNode({
  element,
  selectedElementId,
  onSelect,
  onDuplicate,
  onDelete,
}: CanvasNodeProps) {
  const { setNodeRef, listeners, attributes, isDragging, isOver } =
    useCanvasItem(element.id);
  const { setNodeRef: setChildAreaRef, isOver: isChildAreaOver } = useDroppable(
    {
      id: `${SECTION_DROP_PREFIX}${element.id}`,
    }
  );
  const { Field } = definitionFor('section');

  return (
    <div ref={setNodeRef}>
      <ItemChrome
        selected={selectedElementId === element.id}
        isDragging={isDragging}
        isOver={isOver}
        onSelect={() => onSelect(element.id)}
        onDuplicate={() => onDuplicate(element.id)}
        onDelete={() => onDelete(element.id)}
        listeners={listeners}
        attributes={attributes}
      >
        <Card variant="panel" className="overflow-visible">
          <div className="px-5 py-4">
            <ElementMarkers element={element} />
            <Field
              element={element}
              value={undefined}
              disabled
              onChange={noop}
            />
          </div>
          <Separator />

          <div
            ref={setChildAreaRef}
            className={cn(
              'space-y-3 p-4 transition-colors',
              isChildAreaOver && 'bg-sidebar-accent/40'
            )}
          >
            {(element.children ?? []).map((child) => (
              <CanvasNode
                key={child.id}
                element={child}
                selectedElementId={selectedElementId}
                onSelect={onSelect}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}

            {(element.children?.length ?? 0) === 0 && (
              <p className="border-muted-foreground/25 text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-xs">
                Drop elements here
              </p>
            )}
          </div>
        </Card>
      </ItemChrome>
    </div>
  );
}
