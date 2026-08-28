'use client';

import { MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Switch } from '@/components/shadcn/switch';
import { Textarea } from '@/components/shadcn/textarea';
import type { ChecklistElement, ChecklistSchema } from '@/types/inspection';
import { definitionFor } from '../../builder/element-registry';
import { PropertyGroup } from '../../builder/property-fields';

interface PropertiesPanelProps {
  schema: ChecklistSchema;
  element?: ChecklistElement;
  conditionSources: ChecklistElement[];
  onElementChange: (patch: Partial<ChecklistElement>) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSettingChange: (
    key: keyof ChecklistSchema['settings'],
    value: boolean
  ) => void;
}

/**
 * The right-hand panel. With no selection it edits the checklist itself;
 * with a selection it delegates to that element type's own editor from the
 * registry, so this component never grows a per-type branch.
 */
export function PropertiesPanel({
  schema,
  element,
  conditionSources,
  onElementChange,
  onTitleChange,
  onDescriptionChange,
  onSettingChange,
}: PropertiesPanelProps) {
  if (!element) {
    return (
      <ScrollArea className="h-full">
        <ChecklistProperties
          schema={schema}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onSettingChange={onSettingChange}
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

      <Properties
        element={element}
        onChange={onElementChange}
        availableConditionSources={conditionSources}
      />
    </ScrollArea>
  );
}

function ChecklistProperties({
  schema,
  onTitleChange,
  onDescriptionChange,
  onSettingChange,
}: Pick<
  PropertiesPanelProps,
  'schema' | 'onTitleChange' | 'onDescriptionChange' | 'onSettingChange'
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
            Title
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

      <PropertyGroup title="Settings">
        <SettingToggle
          id="setting-progress"
          label="Show progress bar"
          checked={schema.settings.showProgress ?? false}
          onChange={(value) => onSettingChange('showProgress', value)}
        />
        <SettingToggle
          id="setting-draft"
          label="Allow save as draft"
          checked={schema.settings.allowSaveDraft ?? false}
          onChange={(value) => onSettingChange('allowSaveDraft', value)}
        />
        <SettingToggle
          id="setting-scoring"
          label="Compute compliance score"
          checked={schema.settings.enableScoring ?? false}
          onChange={(value) => onSettingChange('enableScoring', value)}
        />
      </PropertyGroup>
    </>
  );
}

function SettingToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
