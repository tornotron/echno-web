export const invitationKeys = {
  all: ['invitations'] as const,
  byProject: (projectId?: number) =>
    ['invitations', 'project', projectId] as const,
  detail: (id?: number) => ['invitations', 'detail', id] as const,
};
