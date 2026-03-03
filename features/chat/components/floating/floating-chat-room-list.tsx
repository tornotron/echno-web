'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Folder,
  User,
  Bot,
  MessageSquare,
  Users,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatRooms } from '@/hooks/chat/use-chat-rooms';
import { useEmployees } from '@/hooks/employee';
import { useCreateDirectRoom } from '@/hooks/chat/use-chat-mutations';
import { useUser } from '@/hooks/user/use-user';
import { useUserEmployees } from '@/hooks/user/use-user';
import { useOrganizations } from '@/hooks/organization/use-organizations';
import { ChatRoom, ChatRoomType } from '@/types/chat';
import { format } from 'date-fns';
import { stripMentions } from '@/features/chat/utils/message-parser';

interface FloatingChatRoomListProps {
  onSelectRoom: (roomId: number) => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function CompactRoomItem({
  room,
  currentEmployeeId,
  onClick,
}: {
  room: ChatRoom;
  currentEmployeeId?: number;
  onClick: () => void;
}) {
  const participants = room.participants ?? [];
  const lastMsg = room.lastMessage;

  const otherParticipant =
    room.type === ChatRoomType.direct
      ? (participants.find((p) => p.employeeId !== currentEmployeeId) ??
        participants[0])
      : null;

  const Icon =
    room.type === ChatRoomType.ai
      ? Bot
      : room.type === ChatRoomType.group
        ? Folder
        : User;

  const displayName =
    room.name ??
    (room.type === ChatRoomType.direct && otherParticipant
      ? (otherParticipant.employee?.name ??
        `User ${otherParticipant.employeeId}`)
      : participants
          .map((p) => p.employee?.name ?? `User ${p.employeeId}`)
          .join(', '));

  const previewText = lastMsg ? stripMentions(lastMsg.content) : undefined;
  const preview =
    previewText == null
      ? (room.description ?? 'No messages yet')
      : previewText.length > 35
        ? previewText.slice(0, 35) + '…'
        : previewText;

  const timeLabel = lastMsg ? format(lastMsg.createdAt, 'HH:mm') : undefined;

  return (
    <button
      onClick={onClick}
      className="hover:bg-muted flex w-full items-start gap-1.5 rounded-md px-2.5 py-2 text-left transition-colors"
    >
      {room.type === ChatRoomType.direct && otherParticipant ? (
        <Avatar className="mt-0.5 size-6 shrink-0">
          <AvatarImage
            src={otherParticipant.employee?.profilePicture?.file}
            alt={displayName}
          />
          <AvatarFallback className="text-[8px] font-medium">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="bg-muted-foreground/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground h-3 w-3" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-foreground truncate text-[10px] font-semibold">
            {displayName}
          </span>
          {timeLabel && (
            <span className="text-muted-foreground shrink-0 text-[8px]">
              {timeLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground truncate text-[9px]">{preview}</p>
      </div>

      {room.unreadCount > 0 && (
        <Badge className="mt-0.5 ml-0.5 h-3.5 min-w-3.5 shrink-0 rounded-full px-0.5 text-[8px] font-semibold">
          {room.unreadCount > 99 ? '99+' : room.unreadCount}
        </Badge>
      )}
    </button>
  );
}

export function FloatingChatRoomList({
  onSelectRoom,
}: FloatingChatRoomListProps) {
  const [search, setSearch] = useState('');
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [pendingEmployeeId, setPendingEmployeeId] = useState<number | null>(
    null
  );

  const { data: user } = useUser();
  const { data: userEmployees = [] } = useUserEmployees();
  const { data: organizations = [] } = useOrganizations();
  const currentOrg = organizations.find(
    (o) => o.id === user?.defaultOrganizationId
  );
  const { data: rooms = [], isLoading } = useChatRooms(currentOrg?.id);
  const { data: employees = [] } = useEmployees();
  const createDm = useCreateDirectRoom();

  const currentEmployee = userEmployees.find(
    (e) => e.organizationId === user?.defaultOrganizationId
  );
  const currentEmployeeId = currentEmployee?.id;

  const filteredRooms = search.trim()
    ? rooms.filter((r) => {
        const name = r.name ?? '';
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : rooms;

  const filteredEmployees = (
    dmSearch.trim()
      ? employees.filter((e) =>
          e.name.toLowerCase().includes(dmSearch.toLowerCase())
        )
      : employees
  )
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .slice(0, 20); // Limit in floating view

  const handleNewDm = (employeeId: number) => {
    setPendingEmployeeId(employeeId);
    createDm.mutate(employeeId, {
      onSuccess: () => {
        setShowNewDm(false);
        setDmSearch('');
        setPendingEmployeeId(null);
      },
      onError: () => setPendingEmployeeId(null),
    });
  };

  // ── New DM sub-view ────────────────────────────────────────
  if (showNewDm) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => {
              setShowNewDm(false);
              setDmSearch('');
            }}
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          </Button>
          <span className="text-foreground text-[10px] font-semibold">
            New Message
          </span>
        </div>

        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2" />
            <Input
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Search people…"
              className="h-6 pl-6 text-[10px]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="text-muted-foreground/40 h-6 w-6" />
              <p className="text-muted-foreground text-[9px]">
                No people found
              </p>
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isPending = pendingEmployeeId === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => emp.id && handleNewDm(emp.id)}
                  disabled={createDm.isPending}
                  className="hover:bg-muted flex w-full items-center gap-1.5 px-3 py-2 text-left transition-colors disabled:opacity-60"
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage
                      src={emp.profilePicture?.file}
                      alt={emp.name}
                    />
                    <AvatarFallback className="text-[8px] font-medium">
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-[10px] font-semibold">
                      {emp.name}
                    </p>
                    {emp.designation && (
                      <p className="text-muted-foreground truncate text-[8px]">
                        {emp.designation}
                      </p>
                    )}
                  </div>
                  {isPending ? (
                    <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ChevronRight className="text-muted-foreground h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Room list view ────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b px-3 py-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="h-6 pl-6 text-[10px]"
          />
        </div>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {isLoading && (
          <div className="space-y-1 p-1">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex animate-pulse items-center gap-1.5 rounded-md px-2.5 py-2"
              >
                <div className="bg-muted h-6 w-6 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="bg-muted h-2.5 w-3/4 rounded" />
                  <div className="bg-muted h-2 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRooms.map((room) => (
          <CompactRoomItem
            key={room.id}
            room={room}
            currentEmployeeId={currentEmployeeId}
            onClick={() => onSelectRoom(room.id)}
          />
        ))}

        {!isLoading && filteredRooms.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquare className="text-muted-foreground/40 h-6 w-6" />
            <p className="text-muted-foreground text-[9px]">No rooms found</p>
          </div>
        )}
      </div>

      {/* New DM */}
      <div className="border-t px-3 py-2">
        <Button
          variant="outline"
          className="w-full gap-1 text-[9px]"
          size="sm"
          onClick={() => setShowNewDm(true)}
        >
          <Plus className="h-2.5 w-2.5" />
          New Message
        </Button>
      </div>
    </div>
  );
}
