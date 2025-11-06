// Resource Type Enums
export type ResourceType = 'material' | 'equipment' | 'tool' | 'vehicle' | 'other';

export const resourceTypeLabels: Record<ResourceType, string> = {
  material: 'Material',
  equipment: 'Equipment',
  tool: 'Tool',
  vehicle: 'Vehicle',
  other: 'Other',
};

export const resourceTypeColors: Record<ResourceType, string> = {
  material: 'blue',
  equipment: 'purple',
  tool: 'green',
  vehicle: 'orange',
  other: 'zinc',
};
