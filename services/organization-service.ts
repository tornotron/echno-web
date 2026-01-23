import { api } from '@/lib/api/api-client';
import {
  Organization,
  organizationToJsonWithIds,
  parseOrganization,
} from '@/types/organization/organization';

export const organizationService = {
  async getAll() {
    // Note: API returns invalid JSON prefix sometimes or specific wrapper, ensure client handles it or service does.
    // Assuming client handles basic JSON parsing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await api.get<any>('/organization/web');
    // Map response to domain objects (handling array wrapper if needed)
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((item: any) => parseOrganization(item));
    }
    return []; // or throw if format is unexpected
  },

  async getByCreator(creatorId: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await api.get<any>(`/organization/web/creator/${creatorId}`);
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((item: any) => parseOrganization(item));
    }
    return [];
  },

  async getById(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await api.get<any>(`/organization/web/${id}`);
    return parseOrganization(data);
  },

  async update(id: number, org: Organization) {
    const payload = organizationToJsonWithIds(org);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await api.patch<any>(`/organization/web/${id}`, payload);
    return parseOrganization(data);
  },

  async create(org: Organization) {
    // Endpoint Inferred: /organization/web
    const payload = organizationToJsonWithIds(org);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await api.post<any>('/organization/web', payload);
    return parseOrganization(data);
  },

  async delete(id: number) {
    // Endpoint Inferred: /organization/web/:id OR /organization/:id
    // We will try the /web variant first or fallback to what we saw in Postman (/organization/:id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.delete<any>(`/organization/${id}`);
  },
};
