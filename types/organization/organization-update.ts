// TODO: Phase 7 — implement updateOrganizationToJson and replace organizationToJsonWithIds
export interface UpdateOrganizationRequest {
  organizationName?: string;
  organizationAddress?: string;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationWebsite?: string;
  isActive?: boolean;
}
