import { parsePositiveInt } from '@/types/parse-id';
import { CheckItemStatus } from './inspection-enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface InspectionCheckItem {
  id: number;
  category: string;
  checkPoint: string;
  specification: string;
  status: CheckItemStatus;
  remarks?: string;
  photosRequired: boolean;
  photos?: string[];
  measurement?: string;
  expectedValue?: string;
  priority: 'high' | 'medium' | 'low';
}

export function parseInspectionCheckItem(raw: Raw): InspectionCheckItem {
  return {
    id: parsePositiveInt(raw.id, 'parseInspectionCheckItem.id'),
    category: raw.category,
    checkPoint: raw.checkPoint,
    specification: raw.specification,
    status: raw.status as CheckItemStatus,
    remarks: raw.remarks ?? undefined,
    photosRequired: raw.photosRequired ?? false,
    photos: raw.photos ?? undefined,
    measurement: raw.measurement ?? undefined,
    expectedValue: raw.expectedValue ?? undefined,
    priority: raw.priority ?? 'medium',
  };
}
