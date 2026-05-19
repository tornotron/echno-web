import { ApiError } from '@/lib/api/api-client';
import { mockLabour } from '@/components/shared/mock-data';
import type { Labour } from '@/types/third-party/labour';

// TODO: Replace mock data with real API calls once the labour backend is available.
//   getAll:  api.get<Raw[]>('/labour/web')
//   getById: api.get<Raw>(`/labour/web/${id}`)
export const labourService = {
  async getAll(): Promise<Labour[]> {
    return mockLabour as Labour[];
  },

  async getById(id: number): Promise<Labour> {
    const record = (mockLabour as Labour[]).find((l) => l.id === id);
    if (!record) throw new ApiError(`Labour ${id} not found.`, 404);
    return record;
  },
};
