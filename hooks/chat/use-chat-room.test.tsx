import { describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * `useBreadcrumbData` calls `useChatRoom` on every authenticated route, so
 * anything this hook reads unconditionally is read on every navigation. It used
 * to read the whole employee directory and the whole project collection there,
 * on pages that named no chat room at all, which is the shell-wide fetching
 * #269 is about.
 *
 * Both reads below are wired to fail if they happen: the ungated
 * `useEmployeeLookup` and `useProjects` hooks throw, and `getLookup` is counted
 * so an unwanted call shows up as a request rather than as a silent cost.
 */

const getLookup = mock(async () => [
  {
    id: 7,
    employeeId: 'E-7',
    name: 'Amelia Price',
    designation: 'Site Engineer',
    status: 'active',
    organizationId: 1,
  },
]);

mock.module('@tornotron/echno-core/employee/services', () => ({
  employeeService: { getLookup },
}));

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  useEmployees: () => {
    throw new Error('useEmployees must not be called from chat');
  },
  useEmployeeLookup: () => {
    throw new Error(
      'useEmployeeLookup cannot be gated on a room id and must not be called from useChatRoom'
    );
  },
}));

mock.module('@tornotron/echno-core/user/hooks', () => ({
  useUserEmployees: () => ({ data: [] }),
}));

const useProjectCalls: (number | undefined)[] = [];

mock.module('@tornotron/echno-core/project/hooks', () => ({
  useProject: (id?: number) => {
    useProjectCalls.push(id);
    return { data: undefined };
  },
  useProjects: () => {
    throw new Error(
      'useProjects reads every project and must not be called from useChatRoom'
    );
  },
}));

const getRoomById = mock(async (roomId: number) => ({
  id: roomId,
  type: 'direct',
  participants: [{ employeeId: 7, role: 'member', joinedAt: new Date() }],
  updatedAt: new Date(),
}));

mock.module('@/services/chat-service', () => ({
  chatService: { getRooms: async () => [], getRoomById },
}));

const { useChatRoom } = await import('./use-chat-rooms');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useChatRoom — what it reads when there is no room', () => {
  test('reads nothing at all without a room id', async () => {
    getLookup.mockClear();
    getRoomById.mockClear();
    useProjectCalls.length = 0;

    renderHook(() => useChatRoom(undefined), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(getRoomById).not.toHaveBeenCalled();
    expect(getLookup).not.toHaveBeenCalled();
    // The project is read by id, and there is no id to read.
    expect(useProjectCalls.every((id) => id === undefined)).toBe(true);
  });

  test('reads the directory once there is a room to resolve', async () => {
    getLookup.mockClear();
    getRoomById.mockClear();

    const { result } = renderHook(() => useChatRoom(4), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(getRoomById).toHaveBeenCalled();
    expect(getLookup).toHaveBeenCalled();
    expect(result.current.data?.participants?.[0]?.employee?.name).toBe(
      'Amelia Price'
    );
  });
});
