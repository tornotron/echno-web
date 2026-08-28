// hooks/chat/use-chat-rooms.ts

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { chatService } from '@/services/chat-service';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { employeeKeys } from '@tornotron/echno-core/employee/hooks/keys';
import { employeeService } from '@tornotron/echno-core/employee/services';
import { useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { useProject, useProjects } from '@tornotron/echno-core/project/hooks';
import { ChatPerson, ChatRoom, ChatRoomType } from '@/types/chat';
import { Project } from '@tornotron/echno-core/project/types';
import { shouldRetry } from '@/lib/query/retry';

function resolveRoomData(
  rooms: ChatRoom[],
  employees: ChatPerson[],
  projects: Project[]
): ChatRoom[] {
  return rooms.map((room) => ({
    ...room,
    project:
      room.projectId === undefined
        ? undefined
        : projects.find((p) => p.id === room.projectId),
    participants: (room.participants ?? []).map((p) => ({
      ...p,
      employee: employees.find((e) => e.id === p.employeeId),
    })),
    lastMessage: room.lastMessage
      ? {
          ...room.lastMessage,
          sender: employees.find((e) => e.id === room.lastMessage!.senderId),
        }
      : undefined,
  }));
}

function sortRooms(rooms: ChatRoom[]): ChatRoom[] {
  const order: Record<ChatRoomType, number> = {
    [ChatRoomType.ai]: 0,
    [ChatRoomType.group]: 1,
    [ChatRoomType.direct]: 2,
  };
  return rooms.toSorted((a, b) => {
    const typeDiff = order[a.type] - order[b.type];
    if (typeDiff !== 0) return typeDiff;
    // Within same type: sort by last message date descending
    const aTime = a.lastMessage?.createdAt.getTime() ?? a.updatedAt.getTime();
    const bTime = b.lastMessage?.createdAt.getTime() ?? b.updatedAt.getTime();
    return bTime - aTime;
  });
}

/**
 * Hook to fetch all chat rooms for the current user, sorted:
 * project groups → direct messages → AI room.
 */
export function useChatRooms(organizationId?: number) {
  const roomsQuery = useQuery({
    queryKey: ['chat-rooms', 'list', organizationId],
    queryFn: () => chatService.getRooms(organizationId),
    staleTime: 30 * 1000, // 30 seconds — chat is more real-time
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const { data: allEmployees = [] } = useEmployeeLookup();
  const { data: userEmployees = [] } = useUserEmployees();
  const { data: projects = [] } = useProjects();

  const employees = useMemo(() => {
    const map = new Map<number, ChatPerson>();
    for (const e of [...allEmployees, ...userEmployees]) {
      if (e.id !== undefined) map.set(e.id, e);
    }
    return [...map.values()];
  }, [allEmployees, userEmployees]);

  const data = useMemo(() => {
    if (!roomsQuery.data) return roomsQuery.data;
    const resolved = resolveRoomData(roomsQuery.data, employees, projects);
    return sortRooms(resolved);
  }, [roomsQuery.data, employees, projects]);

  return { ...roomsQuery, data };
}

/**
 * The member-safe employee directory, read only when there is something to
 * resolve against it.
 *
 * Core's `useEmployeeLookup` takes no `enabled` flag, and `useChatRoom` below
 * is called from the breadcrumb hook on every authenticated route, so an
 * ungated call there pulls the whole directory on pages that name no chat room
 * at all. The query key and the service call are core's, so a gated read here
 * and an ungated one anywhere else are the same cache entry rather than two
 * requests.
 */
function useEmployeeLookupWhen(enabled: boolean) {
  return useQuery({
    queryKey: employeeKeys.lookup(),
    queryFn: () => employeeService.getLookup(),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single chat room with resolved project + participants.
 *
 * Everything it reads is keyed off `roomId`, because the breadcrumb hook calls
 * it on every route and most routes name no room. The room's project is read
 * by id rather than by scanning the whole project collection, which is the one
 * record the resolution actually needs.
 */
export function useChatRoom(roomId?: number) {
  const roomQuery = useQuery({
    queryKey: ['chat-rooms', 'detail', roomId],
    queryFn: () => {
      if (!roomId) throw new Error('Room ID is required');
      return chatService.getRoomById(roomId);
    },
    enabled: !!roomId,
    staleTime: 30 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const { data: allEmployees = [] } = useEmployeeLookupWhen(!!roomId);
  const { data: userEmployees = [] } = useUserEmployees();
  const { data: project } = useProject(roomQuery.data?.projectId);

  const employees = useMemo(() => {
    const map = new Map<number, ChatPerson>();
    for (const e of [...allEmployees, ...userEmployees]) {
      if (e.id !== undefined) map.set(e.id, e);
    }
    return [...map.values()];
  }, [allEmployees, userEmployees]);

  const projects = useMemo(() => (project ? [project] : []), [project]);

  const data = useMemo(() => {
    if (!roomQuery.data) return roomQuery.data;
    return resolveRoomData([roomQuery.data], employees, projects)[0];
  }, [roomQuery.data, employees, projects]);

  return { ...roomQuery, data };
}
