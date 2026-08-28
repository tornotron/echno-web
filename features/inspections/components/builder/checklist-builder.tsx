'use client';

/**
 * The checklist builder shell.
 *
 * Renders as a modal overlay above the dashboard chrome — visual editing wants
 * the space, and the sidebar and app bar are not useful while authoring. The
 * route still owns it, so the builder stays deep-linkable and refreshable; only
 * the presentation is modal.
 *
 * The panel is capped at {@link SHELL_MAX_WIDTH} rather than filling the
 * viewport. Edge-to-edge looked full but read as empty: the canvas has its own
 * comfortable reading width, so every pixel past the cap became dead gutter
 * either side of it. Capping the shell lets the canvas reach both edges of its
 * column on a wide display, and on anything narrower the overlay is still
 * effectively full-bleed.
 *
 * Desktop is the three-panel layout (palette | canvas | properties). Below
 * `lg` the side panels collapse into sheets — the canvas is always the panel
 * that keeps the space, since it is the thing being edited.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Eye,
  LayoutGrid,
  Pencil,
  Redo2,
  Save,
  Settings2,
  Undo2,
  X,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils/index';
import {
  type ChecklistResponses,
  type ChecklistSchema,
  type ElementType,
  type ResponseValue,
  findElement,
} from '@/types/inspection';
import {
  useBuilderStore,
  useSelectedElement,
} from '../../builder/use-builder-store';
import { definitionFor } from '../../builder/element-registry';
import { ChecklistRenderer } from '../checklist-renderer';
import {
  BuilderCanvas,
  CANVAS_ROOT_ID,
  SECTION_DROP_PREFIX,
} from './builder-canvas';
import { ElementPalette } from './element-palette';
import { PropertiesPanel } from './properties-panel';

/**
 * Widest the overlay grows to.
 *
 * Sized so the canvas column lands just under its own `max-w-5xl` (64rem):
 * 96rem − 14rem palette − 20rem properties = 62rem of canvas. The canvas
 * therefore fills its column edge to edge instead of floating in it.
 */
const SHELL_MAX_WIDTH = 'max-w-[96rem]';

interface ChecklistBuilderProps {
  /**
   * Persist the current schema. The store's dirty flag is cleared on success.
   * May return a promise — "Save and close" waits on it and stays open if the
   * save rejects, so a failed write never silently discards the work.
   *
   * There is no separate publish step. A template save replaces its check
   * points and bumps the server-side version, and no draft state exists to
   * promote out of.
   */
  onSave: (schema: ChecklistSchema) => void | Promise<unknown>;
  /** Dismiss the overlay. Guarded behind a prompt when there are unsaved edits. */
  onClose: () => void;
  saving?: boolean;
  /** Version label shown next to the title, e.g. "v3". */
  versionLabel?: string;
}

export function ChecklistBuilder({
  onSave,
  onClose,
  saving = false,
  versionLabel,
}: ChecklistBuilderProps) {
  const schema = useBuilderStore((state) => state.schema);
  const selectedElementId = useBuilderStore((state) => state.selectedElementId);
  const mode = useBuilderStore((state) => state.mode);
  const dirty = useBuilderStore((state) => state.dirty);
  const canUndo = useBuilderStore((state) => state.past.length > 0);
  const canRedo = useBuilderStore((state) => state.future.length > 0);

  const selectedElement = useSelectedElement();

  const {
    addElement,
    deleteElement,
    duplicateElement,
    moveElement,
    moveIntoSection,
    redo,
    selectElement,
    setDescription,
    setMode,
    setTitle,
    undo,
    updateElement,
  } = useBuilderStore.getState();

  const [activeDrag, setActiveDrag] = useState<string | undefined>();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Closing with unsaved edits asks first — the schema lives only in the
  // store, so dismissing the overlay would otherwise drop the work silently.
  const requestClose = useCallback(() => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }, [dirty, onClose]);

  // `onSave` may return a promise that rejects. The mutation already reports
  // the failure as a toast, so the rejection is handled, but leaving it
  // unhandled surfaces Next's dev error overlay on top of the builder, which
  // reads as a crash. Swallow it at every call site.
  const save = useCallback(() => {
    if (saving) return;
    Promise.resolve(onSave(schema)).catch(() => {});
  }, [onSave, schema, saving]);

  // The overlay covers the page, so the page behind it must not scroll.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Editor shortcuts. A canvas with an undo stack is expected to answer to the
  // usual keys, and reaching for the toolbar to save every time is friction the
  // rest of the app does not impose.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 's') {
        // Beats the browser's own "save page".
        event.preventDefault();
        save();
        return;
      }

      if (modifier && event.key.toLowerCase() === 'z') {
        // Inside a text field this is the caret's undo, not the canvas's.
        if (isTextEntry(event.target)) return;
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      // Escape closes the overlay, but not while a sheet or dialog is open on
      // top of it — those handle their own dismissal first.
      if (event.key === 'Escape') {
        if (paletteOpen || propertiesOpen || confirmDiscard) return;
        requestClose();
      }
    };

    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [
    paletteOpen,
    propertiesOpen,
    confirmDiscard,
    requestClose,
    save,
    undo,
    redo,
  ]);

  // Mouse and touch get separate sensors because the gesture that should start
  // a drag differs. A mouse only has to travel a little, so clicking an element
  // to select it is not mistaken for a drag. A finger that moves is almost
  // always scrolling the canvas, so touch requires a short press to commit —
  // a single PointerSensor with a distance constraint would hijack every
  // attempted scroll.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) =>
    setActiveDrag(String(event.active.id));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(undefined);

      const { active, over } = event;
      if (!over) return;

      const overId = String(over.id);
      const data = active.data.current as
        | { kind: 'palette'; elementType: ElementType }
        | { kind: 'element'; id: string }
        | undefined;
      if (!data) return;

      const sectionId = overId.startsWith(SECTION_DROP_PREFIX)
        ? overId.slice(SECTION_DROP_PREFIX.length)
        : undefined;

      if (data.kind === 'palette') {
        // Dropping onto an element adds to that element's parent section, so
        // the new field lands where the user aimed rather than at the root.
        const target =
          sectionId ??
          (overId === CANVAS_ROOT_ID
            ? undefined
            : parentSectionOf(schema, overId));
        addElement(data.elementType, target);
        return;
      }

      if (sectionId) moveIntoSection(data.id, sectionId);
      else if (overId !== CANVAS_ROOT_ID) moveElement(data.id, overId);
    },
    [schema, addElement, moveElement, moveIntoSection]
  );

  const paletteNode = (
    <ElementPalette
      onAdd={(type) => {
        // Add into the section the user is working in: the selected section
        // itself, or the section owning the selected element. Otherwise root.
        const target =
          selectedElement?.type === 'section'
            ? selectedElement.id
            : parentSectionOf(schema, selectedElementId);
        addElement(type, target);
        setPaletteOpen(false);
      }}
    />
  );

  const propertiesNode = (
    <PropertiesPanel
      schema={schema}
      element={selectedElement}
      onElementChange={(patch) =>
        selectedElementId && updateElement(selectedElementId, patch)
      }
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
    />
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(undefined)}
    >
      {/*
        The backdrop is inert on purpose — no click-to-dismiss. The schema
        lives only in the store, so a stray click outside must not be able to
        throw away unsaved work. Escape and the X button both route through
        `requestClose`, which prompts.
      */}
      <div className="fixed inset-0 z-50 flex bg-black/60 sm:p-4 lg:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checklist builder"
          className={cn(
            'bg-background mx-auto flex h-full w-full flex-col overflow-hidden shadow-2xl sm:rounded-xl sm:border',
            SHELL_MAX_WIDTH
          )}
        >
          {/* ── Toolbar ──────────────────────────────────────────────────── */}
          <div className="bg-card flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={requestClose}
              aria-label="Close builder"
            >
              <X className="size-4" />
            </Button>

            <Separator orientation="vertical" className="mr-1 h-6" />

            <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <LayoutGrid className="size-4" />
                  <span className="sr-only">Elements</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>Elements</SheetTitle>
                  <SheetDescription>Tap an element to add it.</SheetDescription>
                </SheetHeader>
                {paletteNode}
              </SheetContent>
            </Sheet>

            <Input
              value={schema.title}
              aria-label="Checklist name"
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 max-w-64 min-w-0 flex-1 font-medium"
            />

            {versionLabel && (
              <Badge variant="outline" className="shrink-0">
                {versionLabel}
              </Badge>
            )}
            {dirty && (
              <Badge variant="secondary" className="shrink-0">
                Unsaved
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                disabled={!canUndo}
                onClick={undo}
                aria-label="Undo"
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!canRedo}
                onClick={redo}
                aria-label="Redo"
              >
                <Redo2 className="size-4" />
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMode(mode === 'builder' ? 'preview' : 'builder')
                }
              >
                {mode === 'builder' ? (
                  <>
                    <Eye className="size-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </>
                ) : (
                  <>
                    <Pencil className="size-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                disabled={saving}
                onClick={save}
                title="Saves the checklist and moves it to the next version. Inspections already created keep the check points they were made with."
              >
                <Save className="size-4" />
                <span className="hidden sm:inline">
                  {saving ? 'Saving…' : 'Save'}
                </span>
              </Button>

              <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Settings2 className="size-4" />
                    <span className="sr-only">Properties</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetHeader className="border-b">
                    <SheetTitle>Properties</SheetTitle>
                    <SheetDescription>
                      Edit the selected element.
                    </SheetDescription>
                  </SheetHeader>
                  {propertiesNode}
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* ── Panels ─────────────────────────────────────────────────────── */}
          <div className="flex min-h-0 flex-1">
            <aside className="bg-card hidden w-56 shrink-0 border-r lg:block">
              {paletteNode}
            </aside>

            <main className="bg-muted/30 min-w-0 flex-1 overflow-y-auto">
              {mode === 'preview' ? (
                <PreviewPane schema={schema} />
              ) : (
                <BuilderCanvas
                  schema={schema}
                  selectedElementId={selectedElementId}
                  onSelect={(id) => {
                    selectElement(id);
                    setPropertiesOpen(true);
                  }}
                  onDuplicate={duplicateElement}
                  onDelete={deleteElement}
                />
              )}
            </main>

            <aside className="bg-card hidden w-80 shrink-0 border-l lg:block">
              {propertiesNode}
            </aside>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDrag ? <DragPreview id={activeDrag} schema={schema} /> : null}
      </DragOverlay>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This checklist has edits that have not been saved. Closing the
              builder now will lose them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                setConfirmDiscard(false);
                Promise.resolve(onSave(schema)).then(onClose, () => {
                  // Save failed — the mutation surfaces the error; stay open.
                });
              }}
            >
              Save and close
            </Button>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

/**
 * Preview keeps its own throwaway response state so an author can fill the
 * checklist in without those answers ever reaching an inspection.
 */
function PreviewPane({ schema }: { schema: ChecklistSchema }) {
  const [responses, setResponses] = useState<ChecklistResponses>({});

  const handleChange = (elementId: string, value: ResponseValue) =>
    setResponses((previous) => ({ ...previous, [elementId]: value }));

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-xl font-semibold">{schema.title}</h2>
        {schema.description && (
          <p className="text-muted-foreground text-sm">{schema.description}</p>
        )}
      </div>
      <ChecklistRenderer
        schema={schema}
        responses={responses}
        onChange={handleChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DragPreview({ id, schema }: { id: string; schema: ChecklistSchema }) {
  const paletteType = id.startsWith('palette-')
    ? (id.slice('palette-'.length) as ElementType)
    : undefined;

  const label = paletteType
    ? definitionFor(paletteType).label
    : (findElement(schema.elements, id)?.label ?? 'Element');

  return (
    <div
      className={cn(
        'bg-card ring-primary rounded-md px-3 py-2 text-sm font-medium shadow-lg ring-2'
      )}
    >
      {label}
    </div>
  );
}

/** Whether a keystroke landed in something the caret owns. */
function isTextEntry(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
}

/** The id of the section containing `elementId`, if any. */
function parentSectionOf(
  schema: ChecklistSchema,
  elementId?: string
): string | undefined {
  if (!elementId) return undefined;

  for (const element of schema.elements) {
    if (element.type !== 'section') continue;
    if (element.children?.some((child) => child.id === elementId)) {
      return element.id;
    }
  }
  return undefined;
}
