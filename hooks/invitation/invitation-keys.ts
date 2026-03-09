export const invitationKeys = {
  byOrganization: (organizationId?: number) =>
    ['invitations', 'organization', organizationId] as const,
  validate: (userId?: number, inviteCode?: string) =>
    ['invitations', 'validate', userId, inviteCode] as const,
};
