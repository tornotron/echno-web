'use client';

/**
 * The element registry.
 *
 * Every consumer — palette, canvas, properties panel, preview, runtime
 * renderer — reads element behaviour from here. Adding a new element type is
 * one entry in `ELEMENT_REGISTRY` plus its field/properties components; no
 * other file needs to change.
 */

import {
  AlignLeft,
  Calendar,
  Camera,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Hash,
  Heading,
  ListChecks,
  Minus,
  MessageSquare,
  Paperclip,
  PenLine,
  Star,
  Text,
  ThumbsUp,
  ToggleLeft,
  Video,
  Rows3,
} from 'lucide-react';
import { Switch } from '@/components/shadcn/switch';
import { Label } from '@/components/shadcn/label';
import type {
  ChecklistElement,
  ElementGroup,
  ElementType,
} from '@/types/inspection';
import {
  CheckboxField,
  CommentField,
  DateField,
  DescriptionField,
  DividerField,
  FileField,
  HeadingField,
  MultiselectField,
  NumberField,
  PassFailField,
  PhotoField,
  RadioField,
  RatingField,
  SectionField,
  SelectField,
  SignatureField,
  TextField,
  TextareaField,
  VideoField,
  YesNoNaField,
} from './fields';
import {
  LayoutProperties,
  NumericValidation,
  OptionsEditor,
  PlaceholderField,
  PropertyGroup,
  StandardProperties,
  TextValidation,
} from './property-fields';
import type { ElementDefinition, ElementPropertiesProps } from './types';

// ---------------------------------------------------------------------------
// Properties editors
// ---------------------------------------------------------------------------

/** Label + required + conditional logic. The default for simple fields. */
function BasicProperties(props: ElementPropertiesProps) {
  return <StandardProperties {...props} />;
}

function TextProperties(props: ElementPropertiesProps) {
  return (
    <StandardProperties
      {...props}
      extras={
        <>
          <PlaceholderField element={props.element} onChange={props.onChange} />
          <TextValidation element={props.element} onChange={props.onChange} />
        </>
      }
    />
  );
}

function NumberProperties(props: ElementPropertiesProps) {
  return (
    <StandardProperties
      {...props}
      extras={
        <>
          <PlaceholderField element={props.element} onChange={props.onChange} />
          <NumericValidation
            element={props.element}
            onChange={props.onChange}
          />
        </>
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

function RatingProperties(props: ElementPropertiesProps) {
  return (
    <StandardProperties
      {...props}
      extras={
        <NumericValidation element={props.element} onChange={props.onChange} />
      }
    />
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

function DividerProperties() {
  return (
    <PropertyGroup title="Divider">
      <p className="text-muted-foreground text-xs">A divider has no options.</p>
    </PropertyGroup>
  );
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

export const ELEMENT_REGISTRY: Record<ElementType, ElementDefinition> = {
  // ── Basic ────────────────────────────────────────────────────────────────
  text: {
    type: 'text',
    label: 'Text',
    group: 'basic',
    icon: Text,
    defaults: () => ({ label: 'Text field' }),
    Field: TextField,
    Properties: TextProperties,
  },
  textarea: {
    type: 'textarea',
    label: 'Textarea',
    group: 'basic',
    icon: AlignLeft,
    defaults: () => ({ label: 'Long answer' }),
    Field: TextareaField,
    Properties: TextProperties,
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
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    group: 'basic',
    icon: CheckSquare,
    defaults: () => ({ label: 'Checklist item', defaultValue: false }),
    Field: CheckboxField,
    Properties: BasicProperties,
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
  multiselect: {
    type: 'multiselect',
    label: 'Multiselect',
    group: 'basic',
    icon: ListChecks,
    defaults: () => ({
      label: 'Multiple choice',
      options: twoOptions('Option 1', 'Option 2'),
    }),
    Field: MultiselectField,
    Properties: ChoiceProperties,
  },
  date: {
    type: 'date',
    label: 'Date',
    group: 'basic',
    icon: Calendar,
    defaults: () => ({ label: 'Date' }),
    Field: DateField,
    Properties: BasicProperties,
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
  rating: {
    type: 'rating',
    label: 'Rating',
    group: 'inspection',
    icon: Star,
    defaults: () => ({ label: 'Rating', validation: { max: 5 } }),
    Field: RatingField,
    Properties: RatingProperties,
  },
  comment: {
    type: 'comment',
    label: 'Comment',
    group: 'inspection',
    icon: MessageSquare,
    defaults: () => ({
      label: 'Comment',
      placeholder: 'Observations, remarks…',
    }),
    Field: CommentField,
    Properties: TextProperties,
  },
  photo: {
    type: 'photo',
    label: 'Photo Upload',
    group: 'inspection',
    icon: Camera,
    defaults: () => ({ label: 'Photo evidence' }),
    Field: PhotoField,
    Properties: BasicProperties,
  },
  video: {
    type: 'video',
    label: 'Video Upload',
    group: 'inspection',
    icon: Video,
    defaults: () => ({ label: 'Video evidence' }),
    Field: VideoField,
    Properties: BasicProperties,
  },
  file: {
    type: 'file',
    label: 'File Upload',
    group: 'inspection',
    icon: Paperclip,
    defaults: () => ({ label: 'Supporting document' }),
    Field: FileField,
    Properties: BasicProperties,
  },
  signature: {
    type: 'signature',
    label: 'Signature',
    group: 'inspection',
    icon: PenLine,
    defaults: () => ({ label: 'Signature' }),
    Field: SignatureField,
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
  description: {
    type: 'description',
    label: 'Description',
    group: 'layout',
    icon: AlignLeft,
    defaults: () => ({ label: 'Helper text for the inspector.' }),
    Field: DescriptionField,
    Properties: PlainLayoutProperties,
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    group: 'layout',
    icon: Minus,
    defaults: () => ({ label: 'Divider' }),
    Field: DividerField,
    Properties: DividerProperties,
  },
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
  return ELEMENT_REGISTRY[type];
}

/** Builds a new element of `type` with its registry defaults applied. */
export function createElement(type: ElementType, id: string): ChecklistElement {
  const definition = ELEMENT_REGISTRY[type];
  return {
    id,
    type,
    label: definition.label,
    ...definition.defaults(),
  } as ChecklistElement;
}
