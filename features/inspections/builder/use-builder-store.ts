'use client';

/**
 * Builder state.
 *
 * All mutations are local and synchronous — dragging never hits the network.
 * Persistence is an explicit save, which reads `schema` out of this store.
 */

import { create } from 'zustand';
import {
  type ChecklistElement,
  type ChecklistSchema,
  type ElementType,
  createEmptySchema,
  findElement,
  generateElementId,
} from '@/types/inspection';
import { createElement } from './element-registry';

/** Depth of the undo stack. Bounded so a long session cannot grow unbounded. */
const HISTORY_LIMIT = 50;

export type BuilderMode = 'builder' | 'preview';

interface BuilderState {
  schema: ChecklistSchema;
  selectedElementId?: string;
  mode: BuilderMode;
  dirty: boolean;
  saving: boolean;

  past: ChecklistSchema[];
  future: ChecklistSchema[];

  // ── Lifecycle ────────────────────────────────────────────────────────────
  /** Replaces the schema and clears history — used when loading a checklist. */
  load: (schema: ChecklistSchema) => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;
  setMode: (mode: BuilderMode) => void;

  // ── Schema-level ─────────────────────────────────────────────────────────
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;

  // ── Elements ─────────────────────────────────────────────────────────────
  selectElement: (id?: string) => void;
  addElement: (type: ElementType, sectionId?: string) => void;
  updateElement: (id: string, patch: Partial<ChecklistElement>) => void;
  duplicateElement: (id: string) => void;
  deleteElement: (id: string) => void;
  /** Moves `activeId` to the position currently held by `overId`. */
  moveElement: (activeId: string, overId: string) => void;
  /** Moves `activeId` into a section's (possibly empty) child list. */
  moveIntoSection: (activeId: string, sectionId: string) => void;

  // ── History ──────────────────────────────────────────────────────────────
  undo: () => void;
  redo: () => void;
}

// ---------------------------------------------------------------------------
// ElementTree helpers
// ---------------------------------------------------------------------------

type ElementTree = ChecklistElement[];

function mapTree(
  elements: ElementTree,
  fn: (element: ChecklistElement) => ChecklistElement
): ElementTree {
  return elements.map((element) => {
    const mapped = fn(element);
    return mapped.children
      ? { ...mapped, children: mapTree(mapped.children, fn) }
      : mapped;
  });
}

function removeFromTree(elements: ElementTree, id: string): ElementTree {
  return elements
    .filter((element) => element.id !== id)
    .map((element) =>
      element.children
        ? { ...element, children: removeFromTree(element.children, id) }
        : element
    );
}

/** Insert `element` immediately before/after the element with `anchorId`. */
function insertRelative(
  elements: ElementTree,
  anchorId: string,
  element: ChecklistElement,
  position: 'before' | 'after'
): { tree: ElementTree; inserted: boolean } {
  const index = elements.findIndex((item) => item.id === anchorId);

  if (index !== -1) {
    const next = [...elements];
    next.splice(position === 'before' ? index : index + 1, 0, element);
    return { tree: next, inserted: true };
  }

  let inserted = false;
  const tree = elements.map((item) => {
    if (inserted || !item.children) return item;
    const result = insertRelative(item.children, anchorId, element, position);
    if (!result.inserted) return item;
    inserted = true;
    return { ...item, children: result.tree };
  });

  return { tree, inserted };
}

function appendToSection(
  elements: ElementTree,
  sectionId: string,
  element: ChecklistElement
): ElementTree {
  return elements.map((item) => {
    if (item.id === sectionId) {
      return { ...item, children: [...(item.children ?? []), element] };
    }
    if (item.children) {
      return {
        ...item,
        children: appendToSection(item.children, sectionId, element),
      };
    }
    return item;
  });
}

function cloneWithNewIds(element: ChecklistElement): ChecklistElement {
  return {
    ...element,
    id: generateElementId(element.type),
    children: element.children?.map((child) => cloneWithNewIds(child)),
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBuilderStore = create<BuilderState>((set, get) => {
  /**
   * Applies a schema transform, pushing the previous schema onto the undo
   * stack and marking the checklist dirty. Every element mutation goes
   * through here so history stays consistent.
   */
  const commit = (transform: (schema: ChecklistSchema) => ChecklistSchema) =>
    set((state) => ({
      schema: transform(state.schema),
      past: [...state.past, state.schema].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
    }));

  return {
    schema: createEmptySchema(),
    selectedElementId: undefined,
    mode: 'builder',
    dirty: false,
    saving: false,
    past: [],
    future: [],

    load: (schema) =>
      set({
        schema,
        past: [],
        future: [],
        dirty: false,
        selectedElementId: undefined,
        mode: 'builder',
      }),

    markSaved: () => set({ dirty: false, saving: false }),
    setSaving: (saving) => set({ saving }),
    setMode: (mode) => set({ mode }),

    setTitle: (title) => commit((schema) => ({ ...schema, title })),
    setDescription: (description) =>
      commit((schema) => ({ ...schema, description })),

    selectElement: (id) => set({ selectedElementId: id }),

    addElement: (type, sectionId) => {
      const element = createElement(type, generateElementId(type));

      commit((schema) => ({
        ...schema,
        elements: sectionId
          ? appendToSection(schema.elements, sectionId, element)
          : [...schema.elements, element],
      }));

      set({ selectedElementId: element.id });
    },

    updateElement: (id, patch) =>
      commit((schema) => ({
        ...schema,
        elements: mapTree(schema.elements, (element) =>
          element.id === id ? { ...element, ...patch } : element
        ),
      })),

    duplicateElement: (id) => {
      const source = findElement(get().schema.elements, id);
      if (!source) return;

      const copy = cloneWithNewIds(source);
      commit((schema) => ({
        ...schema,
        elements: insertRelative(schema.elements, id, copy, 'after').tree,
      }));
      set({ selectedElementId: copy.id });
    },

    deleteElement: (id) => {
      commit((schema) => ({
        ...schema,
        elements: removeFromTree(schema.elements, id),
      }));

      if (get().selectedElementId === id) set({ selectedElementId: undefined });
    },

    moveElement: (activeId, overId) => {
      if (activeId === overId) return;

      const state = get();
      const active = findElement(state.schema.elements, activeId);
      if (!active) return;

      // Dropping a section inside itself would detach the subtree.
      if (findElement(active.children ?? [], overId)) return;

      commit((schema) => {
        const without = removeFromTree(schema.elements, activeId);
        const { tree, inserted } = insertRelative(
          without,
          overId,
          active,
          'before'
        );
        return { ...schema, elements: inserted ? tree : [...without, active] };
      });
    },

    moveIntoSection: (activeId, sectionId) => {
      if (activeId === sectionId) return;

      const state = get();
      const active = findElement(state.schema.elements, activeId);
      if (!active || active.type === 'section') return;

      commit((schema) => {
        const without = removeFromTree(schema.elements, activeId);
        return {
          ...schema,
          elements: appendToSection(without, sectionId, active),
        };
      });
    },

    undo: () =>
      set((state) => {
        const previous = state.past.at(-1);
        if (!previous) return state;
        return {
          schema: previous,
          past: state.past.slice(0, -1),
          future: [state.schema, ...state.future].slice(0, HISTORY_LIMIT),
          dirty: true,
        };
      }),

    redo: () =>
      set((state) => {
        const [next, ...rest] = state.future;
        if (!next) return state;
        return {
          schema: next,
          past: [...state.past, state.schema].slice(-HISTORY_LIMIT),
          future: rest,
          dirty: true,
        };
      }),
  };
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function useSelectedElement(): ChecklistElement | undefined {
  return useBuilderStore((state) =>
    state.selectedElementId
      ? findElement(state.schema.elements, state.selectedElementId)
      : undefined
  );
}
