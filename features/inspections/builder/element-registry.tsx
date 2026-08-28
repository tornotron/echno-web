'use client';

/**
 * The element registry.
 *
 * Every consumer (palette, canvas, properties panel, preview, runtime
 * renderer) reads element behaviour from here. Adding a new element type is
 * one entry in `ELEMENT_REGISTRY` plus its field/properties components; no
 * other file needs to change.
 *
 * The registry is deliberately narrower than the schema's `ElementType`
 * union. A checklist authored here is stored as a `ChecklistTemplate`, whose
 * items are flat check points, so only the types listed in
 * `REPRESENTABLE_ELEMENT_TYPES` survive a save. Types the backend cannot hold
 * (multiselect, date, rating, checkbox, video, file, signature, divider,
 * description) are kept out of the registry entirely rather than offered and
 * then dropped on the way to the server.
 */

import {
  AlignLeft,
  Camera,
  ChevronDownSquare,
  CircleAlert,
  CircleDot,
  Hash,
  Heading,
  MessageSquare,
  Text,
  ThumbsUp,
  ToggleLeft,
  Rows3,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type {
  ChecklistElement,
  ElementGroup,
  ElementType,
  RepresentableElementType,
} from '@/types/inspection';
import {
  CommentField,
  HeadingField,
  NumberField,
  PassFailField,
  PhotoField,
  RadioField,
  SectionField,
  SelectField,
  TextField,
  TextareaField,
  YesNoNaField,
} from './fields';
import {
  LayoutProperties,
  NumericValidation,
  OptionsEditor,
  PropertyGroup,
  StandardProperties,
} from './property-fields';
import type { ElementDefinition, ElementPropertiesProps } from './types';

// ---------------------------------------------------------------------------
// Properties editors
// ---------------------------------------------------------------------------

/** Label + required. The default for simple fields. */
function BasicProperties(props: ElementPropertiesProps) {
  return <StandardProperties {...props} />;
}

function NumberProperties(props: ElementPropertiesProps) {
  return (
    <StandardProperties
      {...props}
      extras={
        <NumericValidation element={props.element} onChange={props.onChange} />
      }
    />
  );
}

/** Choice fields add an option list below the standard editor. */
function ChoiceProperties(props: ElementPropertiesProps) {
  return (
    <>
      <StandardProperties {...props} />
      <OptionsEditor element={props.element} onChange={props.onChange} />
    </>
  );
}

function SectionProperties({ element, onChange }: ElementPropertiesProps) {
  return (
    <LayoutProperties
      element={element}
      onChange={onChange}
      extras={
        <div className="flex items-center justify-between">
          <Label htmlFor="prop-collapsible" className="text-xs font-medium">
            Collapsible
          </Label>
          <Switch
            id="prop-collapsible"
            checked={element.collapsible ?? false}
            onCheckedChange={(checked) => onChange({ collapsible: checked })}
          />
        </div>
      }
    />
  );
}

function PlainLayoutProperties({ element, onChange }: ElementPropertiesProps) {
  return <LayoutProperties element={element} onChange={onChange} />;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function twoOptions(a: string, b: string) {
  return [
    { label: a, value: a },
    { label: b, value: b },
  ];
}

/**
 * Keyed on `RepresentableElementType`, so the registry cannot drift from the
 * adapter's record of what a stored template can hold. Registering a type the
 * backend has no column for is a compile error rather than a field that
 * vanishes silently on save.
 */
export const ELEMENT_REGISTRY = {
  // ── Basic ────────────────────────────────────────────────────────────────
  text: {
    type: 'text',
    label: 'Text',
    group: 'basic',
    icon: Text,
    defaults: () => ({ label: 'Text field' }),
    Field: TextField,
    Properties: BasicProperties,
  },
  textarea: {
    type: 'textarea',
    label: 'Textarea',
    group: 'basic',
    icon: AlignLeft,
    defaults: () => ({ label: 'Long answer' }),
    Field: TextareaField,
    Properties: BasicProperties,
  },
  number: {
    type: 'number',
    label: 'Number',
    group: 'basic',
    icon: Hash,
    defaults: () => ({ label: 'Number' }),
    Field: NumberField,
    Properties: NumberProperties,
  },
  radio: {
    type: 'radio',
    label: 'Radio',
    group: 'basic',
    icon: CircleDot,
    defaults: () => ({
      label: 'Single choice',
      options: twoOptions('Option 1', 'Option 2'),
    }),
    Field: RadioField,
    Properties: ChoiceProperties,
  },
  select: {
    type: 'select',
    label: 'Select',
    group: 'basic',
    icon: ChevronDownSquare,
    defaults: () => ({
      label: 'Dropdown',
      options: twoOptions('Option 1', 'Option 2'),
    }),
    Field: SelectField,
    Properties: ChoiceProperties,
  },

  // ── Inspection ───────────────────────────────────────────────────────────
  passFail: {
    type: 'passFail',
    label: 'Pass / Fail',
    group: 'inspection',
    icon: ThumbsUp,
    defaults: () => ({ label: 'Pass / Fail check', required: true }),
    Field: PassFailField,
    Properties: BasicProperties,
  },
  yesNoNa: {
    type: 'yesNoNa',
    label: 'Yes / No / N/A',
    group: 'inspection',
    icon: ToggleLeft,
    defaults: () => ({ label: 'Yes / No / N/A check', required: true }),
    Field: YesNoNaField,
    Properties: BasicProperties,
  },
  comment: {
    type: 'comment',
    label: 'Comment',
    group: 'inspection',
    icon: MessageSquare,
    defaults: () => ({ label: 'Comment' }),
    Field: CommentField,
    Properties: BasicProperties,
  },
  photo: {
    type: 'photo',
    label: 'Photo Evidence',
    group: 'inspection',
    icon: Camera,
    defaults: () => ({ label: 'Photo evidence' }),
    Field: PhotoField,
    Properties: BasicProperties,
  },

  // ── Layout ───────────────────────────────────────────────────────────────
  section: {
    type: 'section',
    label: 'Section',
    group: 'layout',
    icon: Rows3,
    defaults: () => ({ label: 'New section', children: [] }),
    Field: SectionField,
    Properties: SectionProperties,
  },
  heading: {
    type: 'heading',
    label: 'Heading',
    group: 'layout',
    icon: Heading,
    defaults: () => ({ label: 'Heading' }),
    Field: HeadingField,
    Properties: PlainLayoutProperties,
  },
} satisfies Partial<Record<RepresentableElementType, ElementDefinition>>;

/**
 * Stand-in for an element type the registry no longer carries.
 *
 * The schema union still names the dropped types, and the runtime renderer
 * looks every element up by type, so a checklist that somehow carries one has
 * to render as something. A plain notice is honest; falling back to a text
 * input would misrepresent what the checklist asks for.
 */
const UNSUPPORTED_ELEMENT: ElementDefinition = {
  type: 'text',
  label: 'Unsupported element',
  group: 'basic',
  icon: CircleAlert,
  defaults: () => ({}),
  Field: ({ element }) => (
    <p className="text-muted-foreground text-sm">
      {element.label}: this field type is no longer supported.
    </p>
  ),
  Properties: () => (
    <PropertyGroup title="Unsupported">
      <p className="text-muted-foreground text-xs">
        This field type cannot be stored in a checklist template. Delete it and
        add a supported one in its place.
      </p>
    </PropertyGroup>
  ),
};

export const ELEMENT_GROUP_LABELS: Record<ElementGroup, string> = {
  basic: 'Basic',
  inspection: 'Inspection',
  layout: 'Layout',
};

export const ELEMENT_GROUPS: ElementGroup[] = ['basic', 'inspection', 'layout'];

/** Palette entries for one group, in registry order. */
export function elementsInGroup(group: ElementGroup): ElementDefinition[] {
  return Object.values(ELEMENT_REGISTRY).filter(
    (definition) => definition.group === group
  );
}

export function definitionFor(type: ElementType): ElementDefinition {
  const registered = ELEMENT_REGISTRY as Partial<
    Record<ElementType, ElementDefinition>
  >;
  return registered[type] ?? UNSUPPORTED_ELEMENT;
}

/** Builds a new element of `type` with its registry defaults applied. */
export function createElement(type: ElementType, id: string): ChecklistElement {
  const definition = definitionFor(type);
  return {
    id,
    type,
    label: definition.label,
    ...definition.defaults(),
  } as ChecklistElement;
}
