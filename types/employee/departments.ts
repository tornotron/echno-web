// types/employee/department.ts
export enum Department {
  engineering = 'engineering',
  construction = 'construction',
  safety = 'safety',
  quality = 'quality',
  administration = 'administration',
  humanResources = 'humanResources',
  finance = 'finance',
  procurement = 'procurement',
  planning = 'planning',
  maintenance = 'maintenance',
  security = 'security',
  operations = 'operations',
  it = 'it',
  legal = 'legal',
  marketing = 'marketing',
}

export function getDepartmentLabel(dept: Department): string {
  const map: Record<Department, string> = {
    [Department.engineering]: 'Engineering',
    [Department.construction]: 'Construction',
    [Department.safety]: 'Safety',
    [Department.quality]: 'Quality',
    [Department.administration]: 'Administration',
    [Department.humanResources]: 'Human Resources',
    [Department.finance]: 'Finance',
    [Department.procurement]: 'Procurement',
    [Department.planning]: 'Planning',
    [Department.maintenance]: 'Maintenance',
    [Department.security]: 'Security',
    [Department.operations]: 'Operations',
    [Department.it]: 'IT',
    [Department.legal]: 'Legal',
    [Department.marketing]: 'Marketing',
  };
  return map[dept];
}