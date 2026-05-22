// TODO: Phase 7 — implement createOrganizationToJson and wire into organization-service
export interface CreateOrganizationRequest {
  organizationName: string;
  organizationAddress: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationWebsite?: string;
  creatorId: number;
  isActive?: boolean;
}
