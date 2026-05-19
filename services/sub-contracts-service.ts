import { ApiError } from '@/lib/api/api-client';
import { mockSubContracts } from '@/components/shared/mock-data';
import type { SubContract } from '@/types/third-party/sub-contract';

// TODO: Replace mock data with real API calls once the sub-contracts backend is available.
//   getAll:  api.get<Raw[]>('/sub-contracts/web')
//   getById: api.get<Raw>(`/sub-contracts/web/${id}`)
export const subContractsService = {
  async getAll(): Promise<SubContract[]> {
    return mockSubContracts as SubContract[];
  },

  async getById(id: number): Promise<SubContract> {
    const record = (mockSubContracts as SubContract[]).find((c) => c.id === id);
    if (!record) throw new ApiError(`Sub-contract ${id} not found.`, 404);
    return record;
  },
};
