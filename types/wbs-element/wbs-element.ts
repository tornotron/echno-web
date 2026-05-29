import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface WbsElement {
  id: number;
  projectId: number;
  name: string;
  code?: string;
  description?: string;
  parentElementId?: number;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  status?: string;
  progress?: number;
  allocatedBudget?: number;
  priority?: string;
  children?: WbsElement[];
}

export function parseWbsElement(raw: Raw): WbsElement {
  return {
    id: parsePositiveInt(raw.id, 'parseWbsElement.id'),
    projectId: raw.projectId,
    name: raw.name ?? '',
    code: raw.code ?? undefined,
    description: raw.description ?? undefined,
    parentElementId: raw.parentElementId ?? undefined,
    plannedStartDate: raw.plannedStartDate
      ? new Date(raw.plannedStartDate)
      : undefined,
    plannedEndDate: raw.plannedEndDate
      ? new Date(raw.plannedEndDate)
      : undefined,
    status: raw.status ?? undefined,
    progress: raw.progress ?? undefined,
    allocatedBudget: raw.allocatedBudget ?? undefined,
    priority: raw.priority ?? undefined,
    children: Array.isArray(raw.children)
      ? (raw.children as Raw[]).map((child: Raw) => parseWbsElement(child))
      : undefined,
  };
}
