import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface InspectionDefect {
  id: number;
  category: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  location: string;
  photos?: string[];
  correctiveAction: string;
  responsibleParty?: string;
  targetDate?: Date;
  status: 'open' | 'in-progress' | 'resolved' | 'verified';
  resolvedDate?: Date;
}

export function parseInspectionDefect(raw: Raw): InspectionDefect {
  return {
    id: parsePositiveInt(raw.id, 'parseInspectionDefect.id'),
    category: raw.category,
    description: raw.description,
    severity: raw.severity,
    location: raw.location,
    photos: raw.photos ?? undefined,
    correctiveAction: raw.correctiveAction,
    responsibleParty: raw.responsibleParty ?? undefined,
    targetDate: raw.targetDate ? new Date(raw.targetDate) : undefined,
    status: raw.status,
    resolvedDate: raw.resolvedDate ? new Date(raw.resolvedDate) : undefined,
  };
}
