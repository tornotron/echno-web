'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ClipboardList,
  Copy,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import {
  useCreateTemplate,
  useDeleteTemplate,
  useInspectionTemplates,
  useUseTemplate,
} from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  InspectionType,
  TemplateCategory,
  createEmptySchema,
  inspectionTypeLabels,
  templateCategoryLabels,
} from '@/types/inspection';
import { ALL } from '@/features/inspections/components';

export default function ChecklistTemplatesPage() {
  const { data: templates = [], isLoading } = useInspectionTemplates();
  const [category, setCategory] = useState(ALL);

  const filtered = useMemo(
    () =>
      category === ALL
        ? templates
        : templates.filter((template) => template.category === category),
    [templates, category]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Checklists"
        description="Build and version the checklist templates used by inspections"
        actions={<CreateChecklistDialog />}
      />

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value={ALL}>All</TabsTrigger>
          {Object.values(TemplateCategory).map((value) => (
            <TabsTrigger key={value} value={value}>
              {templateCategoryLabels[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <TemplateGrid templates={filtered} isLoading={isLoading} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

type Template = NonNullable<
  ReturnType<typeof useInspectionTemplates>['data']
>[number];

function TemplateGrid({
  templates,
  isLoading,
}: {
  templates: Template[];
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
            Create a checklist to define what inspectors fill in on site.
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

function TemplateCard({ template }: { template: Template }) {
  const deleteTemplate = useDeleteTemplate();
  const useTemplate = useUseTemplate();
  const router = useRouter();

  const elementCount = template.schema.elements.length;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <Link
            href={routes.inspections.checklists.detail(template.id).href}
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
              onSelect={() =>
                useTemplate.mutate(
                  { id: template.id, name: `${template.name} (copy)` },
                  {
                    onSuccess: (created) =>
                      router.push(
                        routes.inspections.checklists.detail(created.id).href
                      ),
                  }
                )
              }
            >
              <Copy className="size-4" />
              Use as Template
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => deleteTemplate.mutate(template.id)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          {templateCategoryLabels[template.category]}
        </Badge>
        <Badge variant="secondary">
          {template.currentVersion > 0
            ? `v${template.currentVersion}`
            : 'Draft'}
        </Badge>
      </div>

      <p className="text-muted-foreground text-xs">
        {elementCount} {elementCount === 1 ? 'element' : 'elements'} · updated{' '}
        {format(template.updatedAt, 'dd MMM yyyy')}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

function CreateChecklistDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createTemplate = useCreateTemplate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>(
    TemplateCategory.general
  );
  const [type, setType] = useState<InspectionType>(InspectionType.qaQc);

  const handleSubmit = () => {
    createTemplate.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        type,
        schema: createEmptySchema(name.trim() || 'Untitled Checklist'),
      },
      {
        onSuccess: (template) => {
          setOpen(false);
          setName('');
          setDescription('');
          // Straight into the builder — a checklist with no elements is useless.
          router.push(routes.inspections.checklists.detail(template.id).href);
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
            You will be taken straight to the builder to add elements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              placeholder="e.g. Daily Site Safety Inspection"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as TemplateCategory)
                }
              >
                <SelectTrigger id="template-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TemplateCategory).map((value) => (
                    <SelectItem key={value} value={value}>
                      {templateCategoryLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="template-type">Inspection type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as InspectionType)}
              >
                <SelectTrigger id="template-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(InspectionType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {inspectionTypeLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            disabled={name.trim() === '' || createTemplate.isPending}
            onClick={handleSubmit}
          >
            {createTemplate.isPending ? 'Creating…' : 'Create & open builder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
