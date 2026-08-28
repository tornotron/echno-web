export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  byProject: (projectId: number) =>
    [...inspectionKeys.all, 'project', projectId] as const,
  detail: (id: number) => [...inspectionKeys.all, 'detail', id] as const,
  checklist: (id: number) => [...inspectionKeys.all, 'checklist', id] as const,
  submission: (id: number) =>
    [...inspectionKeys.all, 'submission', id] as const,
};

export const inspectionTemplateKeys = {
  all: ['inspection-templates'] as const,
  lists: () => [...inspectionTemplateKeys.all, 'list'] as const,
  detail: (id: number) =>
    [...inspectionTemplateKeys.all, 'detail', id] as const,
  versions: (id: number) =>
    [...inspectionTemplateKeys.all, 'versions', id] as const,
};

export const ncrDefectKeys = {
  all: ['ncr-defects'] as const,
  lists: () => [...ncrDefectKeys.all, 'list'] as const,
  byProject: (projectId: number) =>
    [...ncrDefectKeys.all, 'project', projectId] as const,
  byInspection: (inspectionId: number) =>
    [...ncrDefectKeys.all, 'inspection', inspectionId] as const,
  detail: (id: number) => [...ncrDefectKeys.all, 'detail', id] as const,
  comments: (id: number) => [...ncrDefectKeys.all, 'comments', id] as const,
};

export const projectDocumentKeys = {
  all: ['project-documents'] as const,
  byProject: (projectId: number) =>
    [...projectDocumentKeys.all, 'project', projectId] as const,
};
