'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ClipboardList,
  MoreHorizontal,
  Plus,
  Power,
  Sparkles,
} from 'lucide-react';
import { ApiError, getErrorMessage } from '@tornotron/echno-core';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/shadcn/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdoptStarterTemplate,
  useChecklistTemplates,
  useCreateChecklistTemplate,
  useStarterChecklistTemplates,
  useUpdateChecklistTemplate,
} from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  InspectionTrade,
  inspectionTradeLabels,
  inspectionTradeOrder,
  type ChecklistTemplate,
} from '@/types/inspection';
import { toast } from '@/lib/styles/toast-styles';

/** Sentinel for the "no trade filter" option, which a Select cannot leave empty. */
const ALL_TRADES = 'all';

/** Opens a checklist in the builder. Template ids are UUIDs. */
const builderHref = (id: string) =>
  routes.inspections.checklists.detail(id).href;

export default function ChecklistTemplatesPage() {
  const { data: templates = [], isLoading } = useChecklistTemplates();
  const [trade, setTrade] = useState<string>(ALL_TRADES);

  const filtered = useMemo(
    () =>
      trade === ALL_TRADES
        ? templates
        : templates.filter((template) => template.trade === trade),
    [templates, trade]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
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

      <div className="flex items-center gap-2">
        <Label htmlFor="trade-filter" className="text-muted-foreground text-sm">
          Trade
        </Label>
        <Select value={trade} onValueChange={setTrade}>
          <SelectTrigger id="trade-filter" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TRADES}>All trades</SelectItem>
            {inspectionTradeOrder.map((value) => (
              <SelectItem key={value} value={value}>
                {inspectionTradeLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TemplateGrid templates={filtered} isLoading={isLoading} />
    </div>
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

  const itemCount = template.items.length;

  // There is no delete endpoint. A checklist that has stopped being used is
  // deactivated instead, which is an ordinary update with `active` flipped.
  const toggleActive = () => {
    updateTemplate.mutate(
      {
        id: template.id,
        req: {
          trade: template.trade,
          name: template.name,
          description: template.description,
          active: !template.active,
          items: template.items,
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          {inspectionTradeLabels[template.trade] ?? template.trade}
        </Badge>
        <Badge variant="secondary">v{template.version}</Badge>
        {!template.active && <Badge variant="outline">Inactive</Badge>}
      </div>

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

/** Trades that do not already hold a checklist. Creating a second returns 409. */
function availableTrades(existing: ChecklistTemplate[]): InspectionTrade[] {
  const taken = new Set(existing.map((template) => template.trade));
  return inspectionTradeOrder.filter((value) => !taken.has(value));
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
  const [trade, setTrade] = useState<InspectionTrade | ''>('');

  const free = availableTrades(existing);

  const handleSubmit = () => {
    if (!trade) return;

    createTemplate.mutate(
      {
        trade,
        name: name.trim(),
        description: description.trim() || undefined,
        active: true,
        items: [FIRST_CHECK_POINT],
      },
      {
        onSuccess: (template) => {
          setOpen(false);
          setName('');
          setDescription('');
          setTrade('');
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
            <Select
              value={trade}
              onValueChange={(value) => setTrade(value as InspectionTrade)}
            >
              <SelectTrigger id="template-trade" className="w-full">
                <SelectValue placeholder="Select a trade" />
              </SelectTrigger>
              <SelectContent>
                {free.map((value) => (
                  <SelectItem key={value} value={value}>
                    {inspectionTradeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {free.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Every trade already has a checklist. Open one to edit it.
              </p>
            )}
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

  const handleAdopt = (trade: InspectionTrade) => {
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
                  {inspectionTradeLabels[starter.trade] ?? starter.trade} ·{' '}
                  {starter.items.length} check points
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
                disabled={taken.has(starter.trade) || adopt.isPending}
                onClick={() => handleAdopt(starter.trade)}
              >
                {taken.has(starter.trade) ? 'Already added' : 'Adopt'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
