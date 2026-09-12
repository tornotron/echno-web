'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ClipboardList,
  MoreHorizontal,
  Plus,
  Target,
  Power,
  Sparkles,
} from 'lucide-react';
import { ApiError, getErrorMessage } from '@tornotron/echno-core';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  useAdoptStarterTemplate,
  useChecklistTemplates,
  useCreateChecklistTemplate,
  useStarterChecklistTemplates,
  useUpdateChecklistTemplate,
} from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  inspectionTradeLabel,
  type ChecklistTemplate,
} from '@/types/inspection';
import { ProjectType } from '@tornotron/echno-core/project/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { Checkbox } from '@/components/shadcn/checkbox';
import { TradePicker } from '@/components/shared/trade-picker';
import {
  ElementTypeMultiPicker,
  ElementTypeSelect,
} from '@/components/shared/element-type-picker';
import {
  ElementTypeSettingsTab,
  TradeSettingsTab,
} from '@/features/inspections/components/catalogue-settings';
import { filterTemplates } from '@/features/inspections/lib/template-filters';
import { toast } from '@/lib/styles/toast-styles';

/** Opens a checklist in the builder. Template ids are UUIDs. */
const builderHref = (id: string) =>
  routes.inspections.checklists.detail(id).href;

export default function ChecklistTemplatesPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="checklists">
        <TabsList>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="element-types">Element types</TabsTrigger>
        </TabsList>
        <TabsContent value="checklists" className="space-y-4 sm:space-y-6">
          <ChecklistsTab />
        </TabsContent>
        <TabsContent value="trades" className="space-y-4">
          <PageHeader
            title="Trades"
            description="The trades inspections and checklists are filed under: the product catalogue plus your own"
          />
          <TradeSettingsTab />
        </TabsContent>
        <TabsContent value="element-types" className="space-y-4">
          <PageHeader
            title="Element types"
            description="What a site structure element can be typed as, and what a checklist can declare itself for"
          />
          <ElementTypeSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChecklistsTab() {
  const { data: templates = [], isLoading } = useChecklistTemplates();
  const [trade, setTrade] = useState('');
  const [elementType, setElementType] = useState('');

  const filtered = useMemo(
    () => filterTemplates(templates, { trade, elementType }),
    [templates, trade, elementType]
  );

  return (
    <>
      <PageHeader
        title="Checklists"
        description="One reusable checklist per trade, used by the inspections on site"
        actions={
          <div className="flex items-center gap-2">
            <StarterTemplatesDialog existing={templates} />
            <CreateChecklistDialog existing={templates} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="trade-filter"
            className="text-muted-foreground text-sm"
          >
            Trade
          </Label>
          <TradePicker
            id="trade-filter"
            className="w-64"
            value={trade}
            emptyLabel="All trades"
            onChange={(code) => setTrade(code)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="element-type-filter"
            className="text-muted-foreground text-sm"
          >
            Suits element
          </Label>
          <ElementTypeSelect
            id="element-type-filter"
            className="w-64"
            value={elementType}
            emptyLabel="Any element type"
            onChange={setElementType}
          />
        </div>
      </div>

      <TemplateGrid templates={filtered} isLoading={isLoading} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

function TemplateGrid({
  templates,
  isLoading,
}: {
  templates: ChecklistTemplate[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card variant="panel" className="p-8">
        <Empty>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>No checklists yet</EmptyTitle>
          <EmptyDescription>
            Create a checklist to define what inspectors fill in on site, or
            adopt one of the starter checklists.
          </EmptyDescription>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function TemplateCard({ template }: { template: ChecklistTemplate }) {
  const updateTemplate = useUpdateChecklistTemplate();
  const [editingApplicability, setEditingApplicability] = useState(false);

  const itemCount = template.items.length;

  // There is no delete endpoint. A checklist that has stopped being used is
  // deactivated instead, which is an ordinary update with `active` flipped.
  const toggleActive = () => {
    updateTemplate.mutate(
      {
        id: template.id,
        req: {
          ...templateIdentity(template),
          name: template.name,
          description: template.description,
          active: !template.active,
          items: template.items,
          applicableElementTypes: template.applicableElementTypes ?? [],
          applicableProjectTypes: template.applicableProjectTypes ?? [],
        },
      },
      {
        onSuccess: (updated) =>
          toast.success(
            updated.active ? 'Checklist activated' : 'Checklist deactivated'
          ),
        onError: (error) =>
          toast.error('Could not update the checklist', {
            description: getErrorMessage(error),
          }),
      }
    );
  };

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <Link
            href={builderHref(template.id)}
            className="block truncate font-medium hover:underline"
          >
            {template.name}
          </Link>
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {template.description || 'No description'}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Checklist actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={updateTemplate.isPending}
              onSelect={toggleActive}
            >
              <Power className="size-4" />
              {template.active ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={updateTemplate.isPending}
              onSelect={() => setEditingApplicability(true)}
            >
              <Target className="size-4" />
              Applicability
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          {template.trade || template.tradeName
            ? inspectionTradeLabel(template.trade, template.tradeName)
            : 'Unknown trade'}
        </Badge>
        <Badge variant="secondary">v{template.version}</Badge>
        {!template.active && <Badge variant="outline">Inactive</Badge>}
        {isScoped(template) && (
          <Badge variant="outline" title={applicabilitySummary(template)}>
            Scoped
          </Badge>
        )}
      </div>

      {editingApplicability && (
        <ApplicabilityDialog
          template={template}
          open={editingApplicability}
          onOpenChange={setEditingApplicability}
        />
      )}

      <p className="text-muted-foreground text-xs">
        {itemCount} {itemCount === 1 ? 'check point' : 'check points'}
        {template.updatedAt
          ? ` · updated ${format(template.updatedAt, 'dd MMM yyyy')}`
          : ''}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * The first check point a new checklist is created with.
 *
 * A create request has to carry at least one item, and the author is sent
 * straight into the builder to replace it, so it is a placeholder rather than
 * content anyone is meant to keep.
 */
const FIRST_CHECK_POINT = {
  category: 'General',
  checkPoint: 'First check point',
  photosRequired: false,
};

/**
 * The trade reference an update sends back. The trade is fixed at creation
 * and the backend rejects a change, so it goes back exactly as it came: the
 * row id when the template carries one, else the slug.
 */
function templateIdentity(template: ChecklistTemplate): {
  tradeId?: string;
  trade?: string;
} {
  return template.tradeId
    ? { tradeId: template.tradeId }
    : { trade: template.trade };
}

/** Human-readable project type: `MIXED_USE` reads "Mixed use". */
function projectTypeLabel(type: ProjectType): string {
  const words = type.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Whether the template declares any applicability; empty lists mean any. */
function isScoped(template: ChecklistTemplate): boolean {
  return (
    (template.applicableElementTypes?.length ?? 0) > 0 ||
    (template.applicableProjectTypes?.length ?? 0) > 0
  );
}

function applicabilitySummary(template: ChecklistTemplate): string {
  const parts: string[] = [];
  if (template.applicableElementTypes)
    parts.push(`Elements: ${template.applicableElementTypes.join(', ')}`);
  if (template.applicableProjectTypes)
    parts.push(
      `Projects: ${template.applicableProjectTypes.map((t) => projectTypeLabel(t)).join(', ')}`
    );
  return parts.join(' · ');
}

/** Trade codes that already hold a checklist. Creating a second returns 409. */
function takenTrades(existing: ChecklistTemplate[]): Set<string> {
  return new Set(
    existing.flatMap((template) => (template.trade ? [template.trade] : []))
  );
}

/**
 * The applicability editor shared by the create dialog and the per-card
 * dialog: which element types and project types the checklist is suggested
 * for. Nothing selected means any.
 */
function ApplicabilityFields({
  elementTypes,
  projectTypes,
  onElementTypes,
  onProjectTypes,
}: {
  elementTypes: string[];
  projectTypes: ProjectType[];
  onElementTypes: (codes: string[]) => void;
  onProjectTypes: (types: ProjectType[]) => void;
}) {
  const toggleProject = (type: ProjectType, checked: boolean) =>
    onProjectTypes(
      Object.values(ProjectType).filter((t) =>
        t === type ? checked : projectTypes.includes(t)
      )
    );
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Suits element types</Label>
        <p className="text-muted-foreground text-xs">
          Suggested when an element of one of these types is inspected. Leave
          empty for any.
        </p>
        <ElementTypeMultiPicker
          value={elementTypes}
          onChange={onElementTypes}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Suits project types</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {Object.values(ProjectType).map((type) => (
            <label
              key={type}
              htmlFor={`project-type-${type}`}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                id={`project-type-${type}`}
                checked={projectTypes.includes(type)}
                onCheckedChange={(checked) =>
                  toggleProject(type, checked === true)
                }
              />
              {projectTypeLabel(type)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicabilityDialog({
  template,
  open,
  onOpenChange,
}: {
  template: ChecklistTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTemplate = useUpdateChecklistTemplate();
  const [elementTypes, setElementTypes] = useState<string[]>(
    template.applicableElementTypes ?? []
  );
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>(
    template.applicableProjectTypes ?? []
  );

  const save = () =>
    updateTemplate.mutate(
      {
        id: template.id,
        req: {
          ...templateIdentity(template),
          name: template.name,
          description: template.description,
          active: template.active,
          items: template.items,
          applicableElementTypes: elementTypes,
          applicableProjectTypes: projectTypes,
        },
      },
      {
        onSuccess: () => {
          toast.success('Applicability saved');
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error('Could not save the applicability', {
            description: getErrorMessage(error),
          }),
      }
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Where {template.name} applies</DialogTitle>
          <DialogDescription>
            A suggestion filter only: any checklist may still be used on any
            element.
          </DialogDescription>
        </DialogHeader>
        <ApplicabilityFields
          elementTypes={elementTypes}
          projectTypes={projectTypes}
          onElementTypes={setElementTypes}
          onProjectTypes={setProjectTypes}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={updateTemplate.isPending} onClick={save}>
            {updateTemplate.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateChecklistDialog({
  existing,
}: {
  existing: ChecklistTemplate[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createTemplate = useCreateChecklistTemplate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trade, setTrade] = useState('');
  const [tradeId, setTradeId] = useState<string | undefined>();
  const [elementTypes, setElementTypes] = useState<string[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);

  const taken = useMemo(() => takenTrades(existing), [existing]);

  const handleSubmit = () => {
    if (!trade) return;

    createTemplate.mutate(
      {
        trade,
        tradeId,
        name: name.trim(),
        description: description.trim() || undefined,
        active: true,
        items: [FIRST_CHECK_POINT],
        applicableElementTypes: elementTypes,
        applicableProjectTypes: projectTypes,
      },
      {
        onSuccess: (template) => {
          setOpen(false);
          setName('');
          setDescription('');
          setTrade('');
          setTradeId(undefined);
          setElementTypes([]);
          setProjectTypes([]);
          // Straight into the builder: a checklist with one placeholder check
          // point is not yet worth anything to an inspector.
          router.push(builderHref(template.id));
        },
        onError: (error) => {
          const conflict = error instanceof ApiError && error.status === 409;
          toast.error(
            conflict
              ? 'That trade already has a checklist'
              : 'Could not create the checklist',
            {
              description: conflict
                ? 'Each trade carries one checklist. Open the existing one and edit it instead.'
                : getErrorMessage(error),
            }
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Checklist
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New checklist</DialogTitle>
          <DialogDescription>
            A checklist belongs to one trade, and each trade carries one
            checklist. You will be taken straight to the builder, which opens on
            a single placeholder check point to replace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              placeholder="e.g. Reinforcement Pre-pour Check"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-trade">Trade</Label>
            <TradePicker
              id="template-trade"
              value={trade}
              exclude={taken}
              onChange={(code, row) => {
                setTrade(code);
                setTradeId(row?.id);
              }}
            />
            <p className="text-muted-foreground text-xs">
              Trades that already hold a checklist are left out. Add new trades
              under the Trades tab.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <ApplicabilityFields
            elementTypes={elementTypes}
            projectTypes={projectTypes}
            onElementTypes={setElementTypes}
            onProjectTypes={setProjectTypes}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              name.trim() === '' || trade === '' || createTemplate.isPending
            }
            onClick={handleSubmit}
          >
            {createTemplate.isPending ? 'Creating…' : 'Create & open builder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Starter templates
// ---------------------------------------------------------------------------

/**
 * The product-supplied checklists.
 *
 * Adopting one copies it into the organization as an ordinary editable
 * checklist for that trade, so it is refused for a trade that already has one.
 */
function StarterTemplatesDialog({
  existing,
}: {
  existing: ChecklistTemplate[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: starters = [], isLoading } = useStarterChecklistTemplates();
  const adopt = useAdoptStarterTemplate();

  const taken = new Set(existing.map((template) => template.trade));

  const handleAdopt = (trade: string) => {
    adopt.mutate(trade, {
      onSuccess: (template) => {
        setOpen(false);
        router.push(builderHref(template.id));
      },
      onError: (error) =>
        toast.error('Could not adopt that starter checklist', {
          description: getErrorMessage(error),
        }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="size-4" />
          Starter checklists
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Start from a starter checklist</DialogTitle>
          <DialogDescription>
            Adopting one copies its check points into your organization as a
            checklist you own and can edit.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {isLoading && <Skeleton className="h-24 w-full" />}

          {!isLoading && starters.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No starter checklists are available.
            </p>
          )}

          {starters.map((starter) => (
            <div
              key={starter.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium">{starter.name}</p>
                <p className="text-muted-foreground text-xs">
                  {starter.trade
                    ? inspectionTradeLabel(starter.trade)
                    : 'Unknown trade'}{' '}
                  · {starter.items.length} check points
                </p>
                {starter.description && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {starter.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  !starter.trade || taken.has(starter.trade) || adopt.isPending
                }
                onClick={() => starter.trade && handleAdopt(starter.trade)}
              >
                {starter.trade
                  ? taken.has(starter.trade)
                    ? 'Already added'
                    : 'Adopt'
                  : 'Unavailable'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
