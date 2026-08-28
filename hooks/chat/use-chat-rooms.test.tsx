import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * The floating chat is mounted in the dashboard shell, so these hooks run on every
 * page. They must read the employee directory from the member-safe lookup
 * (`GET /employee/web/lookup`, readable by any tenant member), never from the full
 * employee list (`GET /employee/web`), which the backend restricts to system-admin,
 * hr-admin and project-manager. Reading the full list here returned 403 on every
 * page load for every member without one of those roles, so `useEmployees` below is
 * wired to throw: calling it at all is the regression.
 */

const lookupRows = [
  {
    id: 7,
    employeeId: 'E-7',
    name: 'Amelia Price',
    designation: 'Site Engineer',
    status: 'active',
    organizationId: 1,
  },
];

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  useEmployees: () => {
    throw new Error(
      'useEmployees reads the management-only employee list and must not be called from chat'
    );
  },
  useEmployeeLookup: () => ({ data: lookupRows }),
}));

mock.module('@tornotron/echno-core/user/hooks', () => ({
  useUserEmployees: () => ({ data: [] }),
}));

mock.module('@tornotron/echno-core/project/hooks', () => ({
  useProjects: () => ({ data: [] }),
}));

const getRooms = mock(async (_organizationId?: number) => [
  {
    id: 1,
    type: 'direct',
    participants: [{ employeeId: 7, role: 'member', joinedAt: new Date() }],
    updatedAt: new Date(),
  },
]);

mock.module('@/services/chat-service', () => ({
  chatService: { getRooms, getRoomById: async () => null },
}));

const { useChatRooms } = await import('./use-chat-rooms');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  getRooms.mockClear();
});

describe('useChatRooms — the employee directory it reads', () => {
  test('resolves participants from the member-safe lookup, not the full list', async () => {
    const { result } = renderHook(() => useChatRooms(1), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    const participant = result.current.data?.[0]?.participants?.[0];
    expect(participant?.employee?.name).toBe('Amelia Price');
  });
});
