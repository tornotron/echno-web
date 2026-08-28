import type { LucideIcon } from 'lucide-react';
import type {
  ChecklistElement,
  ElementGroup,
  ElementType,
  ResponseValue,
} from '@/types/inspection';

/**
 * Props every element renderer receives.
 *
 * The same component serves the builder canvas, the preview and the live
 * runtime — `disabled` is what the builder passes so the canvas is inert.
 */
export interface ElementFieldProps {
  element: ChecklistElement;
  value: ResponseValue;
  onChange: (value: ResponseValue) => void;
  /** Builder canvas renders fields non-interactive. */
  disabled?: boolean;
  error?: string;
}

/** Props for an element's properties editor in the builder's right panel. */
export interface ElementPropertiesProps {
  element: ChecklistElement;
  /** Shallow-merges a patch into the selected element. */
  onChange: (patch: Partial<ChecklistElement>) => void;
}

/**
 * One entry in the element registry.
 *
 * Adding an element type means adding a definition here — the palette, canvas,
 * properties panel and runtime renderer all read from the registry and need no
 * changes of their own.
 */
export interface ElementDefinition {
  type: ElementType;
  label: string;
  group: ElementGroup;
  icon: LucideIcon;
  /** Field defaults applied when the element is dropped onto the canvas. */
  defaults: () => Partial<ChecklistElement>;
  Field: React.ComponentType<ElementFieldProps>;
  Properties: React.ComponentType<ElementPropertiesProps>;
}
