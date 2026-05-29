import { parsePositiveInt } from '@/types/parse-id';
import type { IndentStatus } from './enums';
import type { IndentItem } from './indent-item';
import { parseIndentItem } from './indent-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface Indent {
  id: number;
  indentNumber: string;
  createdAt: string;
  createdBy: { id: number; name: string };
  status: IndentStatus;
  expectedOn?: string;
  remarks?: string;
  projectId?: number;
  projectName?: string;
  items: IndentItem[];
}

export function parseIndent(raw: Raw): Indent {
  return {
    id: parsePositiveInt(raw.id, 'parseIndent.id'),
    indentNumber: raw.indentNumber ?? '',
    createdAt: raw.createdAt,
    createdBy: {
      id: parsePositiveInt(raw.createdBy?.id, 'parseIndent.createdBy.id'),
      name: raw.createdBy?.employeeName ?? '',
    },
    status: raw.status as IndentStatus,
    expectedOn: raw.expectedOn ?? undefined,
    remarks: raw.remarks ?? undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
    items: Array.isArray(raw.items)
      ? (raw.items as Raw[]).map((item) => parseIndentItem(item))
      : [],
  };
}
