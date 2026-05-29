export const wbsElementKeys = {
  all: ['wbs-elements'] as const,
  byProject: (projectId: number) =>
    [...wbsElementKeys.all, 'project', projectId] as const,
  tree: (projectId: number) =>
    [...wbsElementKeys.byProject(projectId), 'tree'] as const,
  leaves: (projectId: number) =>
    [...wbsElementKeys.byProject(projectId), 'leaves'] as const,
  detail: (projectId: number, elementId: number) =>
    [...wbsElementKeys.byProject(projectId), elementId] as const,
};
