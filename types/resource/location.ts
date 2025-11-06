// Location Type
export interface Location {
  id: number;
  name: string;
  type: LocationType;
  address?: string;
  capacity?: number;
  organizationId: number;
  projectId?: number;
  isActive: boolean;
}

export type LocationType = 'godown' | 'head-office' | 'project-site' | 'warehouse' | 'other';

export const locationTypeLabels: Record<LocationType, string> = {
  godown: 'Godown',
  'head-office': 'Head Office',
  'project-site': 'Project Site',
  warehouse: 'Warehouse',
  other: 'Other',
};

export const locationTypeColors: Record<LocationType, string> = {
  godown: 'blue',
  'head-office': 'purple',
  'project-site': 'green',
  warehouse: 'orange',
  other: 'zinc',
};
