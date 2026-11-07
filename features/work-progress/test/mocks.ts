/**
 * What the Work Progress component tests replace. The core services are
 * stubbed so the real query and mutation hooks run through TanStack; the
 * role gate, the module list, the sub-contract list and the toast are the
 * app's own and are set per test through `gates`.
 */
import { afterAll, mock } from 'bun:test';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realWbsServices from '@tornotron/echno-core/wbs/services';
import * as realWorkProgressServices from '@tornotron/echno-core/work-progress/services';
import * as realSubContracts from '@/hooks/sub-contracts';
import * as realUseCan from '@/hooks/use-can';
import * as realUseEnabledModuleIds from '@/hooks/use-enabled-module-ids';
import * as realToastStyles from '@/lib/styles/toast-styles';
import type { AccessConfig } from '@/nav/access/roles';

// Copied now, before `installMocks` runs: a namespace object is live, so once a
// module is mocked its namespace reads as the mock.
const originals: Record<string, Record<string, unknown>> = {
  '@tornotron/echno-core/employee/hooks': { ...realEmployeeHooks },
  '@tornotron/echno-core/wbs/services': { ...realWbsServices },
  '@tornotron/echno-core/work-progress/services': {
    ...realWorkProgressServices,
  },
  '@/hooks/sub-contracts': { ...realSubContracts },
  '@/hooks/use-can': { ...realUseCan },
  '@/hooks/use-enabled-module-ids': { ...realUseEnabledModuleIds },
  '@/lib/styles/toast-styles': { ...realToastStyles },
};

export const gates: { orgRoles: string[]; modules: string[] } = {
  orgRoles: [],
  modules: [],
};

export const wbs = {
  getSchedule: mock(
    async (_projectId: number): Promise<unknown> => ({
      activities: [],
      dependencies: [],
    })
  ),
  deleteActivity: mock(async () => {}),
};

export const workProgress = {
  record: mock(
    async (_req: unknown): Promise<unknown> => ({ id: 'r1', outcome: 'DONE' })
  ),
  list: mock(async () => ({
    content: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
  })),
  getEvidence: mock(async () => []),
  presignEvidence: mock(async () => []),
  registerEvidence: mock(async () => []),
};

export const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
};

export function installMocks() {
  afterAll(restoreMocks);
  mock.module('@tornotron/echno-core/wbs/services', () => ({
    ...realWbsServices,
    wbsService: { ...realWbsServices.wbsService, ...wbs },
  }));
  mock.module('@tornotron/echno-core/work-progress/services', () => ({
    ...realWorkProgressServices,
    workProgressService: {
      ...realWorkProgressServices.workProgressService,
      ...workProgress,
    },
  }));
  mock.module('@tornotron/echno-core/employee/hooks', () => ({
    ...realEmployeeHooks,
    useEmployeeLookup: () => ({ data: [], isPending: false }),
  }));
  mock.module('@/hooks/sub-contracts', () => ({
    useSubContracts: () => ({ data: [], isPending: false }),
  }));
  mock.module('@/hooks/use-can', () => ({
    useCan: (config: AccessConfig) => ({
      allowed: (config.allowOrgRoles ?? []).some((role) =>
        gates.orgRoles.includes(role)
      ),
      isLoading: false,
    }),
  }));
  mock.module('@/hooks/use-enabled-module-ids', () => ({
    useEnabledModuleIds: () => ({
      moduleIds: new Set(gates.modules),
      isLoading: false,
      isError: false,
      refetch: async () => {},
    }),
  }));
  mock.module('@/lib/styles/toast-styles', () => ({ toast }));
}

/**
 * Puts back every module `installMocks` replaced. `mock.module` is process-wide
 * and outlives the test file, so a mock left in place keeps answering in
 * whichever file runs next: the role gate then decides by the roles the last
 * test here happened to leave in `gates`, and every page behind it passes or
 * refuses according to file order.
 */
function restoreMocks() {
  for (const [path, original] of Object.entries(originals)) {
    mock.module(path, () => original);
  }
}

export function resetMocks() {
  gates.orgRoles = [];
  gates.modules = [];
  wbs.getSchedule.mockReset();
  wbs.getSchedule.mockImplementation(async () => ({
    activities: [],
    dependencies: [],
  }));
  workProgress.record.mockReset();
  workProgress.record.mockImplementation(async () => ({
    id: 'r1',
    outcome: 'DONE',
  }));
  toast.success.mockClear();
  toast.error.mockClear();
}
