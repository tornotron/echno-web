// Resource Status Enums
export type ResourceStatus = 'available' | 'in-use' | 'maintenance' | 'damaged' | 'retired';

export const resourceStatusLabels: Record<ResourceStatus, string> = {
  available: 'Available',
  'in-use': 'In Use',
  maintenance: 'Maintenance',
  damaged: 'Damaged',
  retired: 'Retired',
};

export const resourceStatusColors: Record<ResourceStatus, string> = {
  available: 'green',
  'in-use': 'blue',
  maintenance: 'orange',
  damaged: 'red',
  retired: 'zinc',
};
