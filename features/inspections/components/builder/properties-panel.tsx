'use client';

import { MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { ChecklistElement, ChecklistSchema } from '@/types/inspection';
import { definitionFor } from '../../builder/element-registry';
import { PropertyGroup } from '../../builder/property-fields';

interface PropertiesPanelProps {
  schema: ChecklistSchema;
  element?: ChecklistElement;
  onElementChange: (patch: Partial<ChecklistElement>) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

/**
 * The right-hand panel. With no selection it edits the checklist itself;
 * with a selection it delegates to that element type's own editor from the
 * registry, so this component never grows a per-type branch.
 */
export function PropertiesPanel({
  schema,
  element,
  onElementChange,
  onTitleChange,
  onDescriptionChange,
}: PropertiesPanelProps) {
  if (!element) {
    return (
      <ScrollArea className="h-full">
        <ChecklistProperties
          schema={schema}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      </ScrollArea>
    );
  }

  const definition = definitionFor(element.type);
  const { Properties } = definition;

  return (
    <ScrollArea className="h-full">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <definition.icon className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">{definition.label}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {element.type}
        </Badge>
      </div>

      <Properties element={element} onChange={onElementChange} />
    </ScrollArea>
  );
}

function ChecklistProperties({
  schema,
  onTitleChange,
  onDescriptionChange,
}: Pick<
  PropertiesPanelProps,
  'schema' | 'onTitleChange' | 'onDescriptionChange'
>) {
  return (
    <>
      <div className="text-muted-foreground flex items-center gap-2 border-b px-4 py-3">
        <MousePointerClick className="size-4" />
        <span className="text-sm">Select an element to edit it</span>
      </div>

      <PropertyGroup title="Checklist">
        <div className="space-y-1.5">
          <Label htmlFor="checklist-title" className="text-xs font-medium">
            Name
          </Label>
          <Input
            id="checklist-title"
            value={schema.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="checklist-description"
            className="text-xs font-medium"
          >
            Description
          </Label>
          <Textarea
            id="checklist-description"
            rows={3}
            value={schema.description ?? ''}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>
      </PropertyGroup>

      {/*
        The old panel carried checklist-level toggles (progress bar, save as
        draft, compliance scoring). A stored template has no column for any of
        them, so they were switches that reset themselves on the next load.
        What an author does need to know at this level is what saving costs,
        which is the note below.
      */}
      <PropertyGroup title="Saving">
        <p className="text-muted-foreground text-xs">
          Saving replaces every check point in this template and moves it to the
          next version number. Inspections already created keep the check points
          they were created with, so nothing in progress changes under an
          inspector.
        </p>
      </PropertyGroup>
    </>
  );
}
