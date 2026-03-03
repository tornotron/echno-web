'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Folder,
  User,
  Bot,
  MessageSquare,
  Users,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useChatRooms } from '@/hooks/chat/use-chat-rooms';
import { useEmployees } from '@/hooks/employee';
import { useCreateDirectRoom } from '@/hooks/chat/use-chat-mutations';
import { useUser } from '@/hooks/user/use-user';
import { useUserEmployees } from '@/hooks/user/use-user';
import { useOrganizations } from '@/hooks/organization/use-organizations';
import { ChatRoom, ChatRoomType } from '@/types/chat';
import { format } from 'date-fns';
import {
  stripMentions,
  getAvatarColor,
} from '@/features/chat/utils/message-parser';

interface ChatSidebarProps {
  onRoomSelect?: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function RoomItem({
  room,
  isActive,
  currentEmployeeId,
  onSelect,
}: {
  room: ChatRoom;
  isActive: boolean;
  currentEmployeeId?: number;
  onSelect?: () => void;
}) {
  const participants = room.participants ?? [];
  const lastMsg = room.lastMessage;

  // For DMs, find the other participant to show their avatar
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
      : previewText.length > 50
        ? previewText.slice(0, 50) + '…'
        : previewText;

  const timeLabel = lastMsg ? format(lastMsg.createdAt, 'HH:mm') : undefined;

  return (
    <Link
      href={`/users/dashboard/chat/${room.id}`}
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground hover:bg-accent'
          : 'hover:bg-muted'
      }`}
    >
      {/* Avatar for DMs, icon for groups/AI */}
      {room.type === ChatRoomType.direct && otherParticipant ? (
        <div
          className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full text-xs font-semibold ${getAvatarColor(displayName)}`}
        >
          {otherParticipant.employee?.profilePicture?.file ? (
            <Image
              src={otherParticipant.employee.profilePicture.file}
              alt={displayName}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </div>
      ) : (
        <div className="bg-muted-foreground/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium">{displayName}</span>
          {timeLabel && (
            <span className="text-muted-foreground shrink-0 text-[10px]">
              {timeLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">{preview}</p>
      </div>

      {room.unreadCount > 0 && (
        <Badge className="mt-0.5 ml-1 h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[10px]">
          {room.unreadCount > 99 ? '99+' : room.unreadCount}
        </Badge>
      )}
    </Link>
  );
}

export function ChatSidebar({ onRoomSelect }: ChatSidebarProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [dmSheetOpen, setDmSheetOpen] = useState(false);
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

  // Determine current employee ID for DM avatar resolution
  const currentEmployee = userEmployees.find(
    (e) => e.organizationId === user?.defaultOrganizationId
  );
  const currentEmployeeId = currentEmployee?.id;

  const activeRoomId = pathname.match(/\/chat\/(\d+)/)?.[1];

  const filteredRooms = search.trim()
    ? rooms.filter((r) => {
        const name = r.name ?? '';
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : rooms;

  const groupRooms = filteredRooms.filter((r) => r.type === ChatRoomType.group);
  const dmRooms = filteredRooms.filter((r) => r.type === ChatRoomType.direct);
  const aiRooms = filteredRooms.filter((r) => r.type === ChatRoomType.ai);

  const filteredEmployees = (
    dmSearch.trim()
      ? employees.filter((e) =>
          e.name.toLowerCase().includes(dmSearch.toLowerCase())
        )
      : employees
  ).toSorted((a, b) => a.name.localeCompare(b.name));

  // Group employees by first letter of name for alphabetical sections
  const groupedEmployees: Record<string, typeof employees> = {};
  for (const emp of filteredEmployees) {
    const letter = emp.name[0]?.toUpperCase() ?? '#';
    (groupedEmployees[letter] ??= []).push(emp);
  }
  const sortedLetters = Object.keys(groupedEmployees).toSorted();

  const handleNewDm = (employeeId: number) => {
    setPendingEmployeeId(employeeId);
    createDm.mutate(employeeId, {
      onSuccess: () => {
        setDmSheetOpen(false);
        setDmSearch('');
        setPendingEmployeeId(null);
      },
      onError: () => setPendingEmployeeId(null),
    });
  };

  return (
    <div className="bg-background flex h-full flex-col border-r">
      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="space-y-1 p-1">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <div className="bg-muted h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="bg-muted h-3 w-3/4 rounded" />
                  <div className="bg-muted h-2.5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI ASSISTANT */}
        {aiRooms.length > 0 && (
          <div className="mb-3">
            <p className="text-muted-foreground mb-1 px-3 text-[10px] font-semibold tracking-wider uppercase">
              AI Assistant
            </p>
            {aiRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={String(room.id) === activeRoomId}
                currentEmployeeId={currentEmployeeId}
                onSelect={onRoomSelect}
              />
            ))}
          </div>
        )}

        {/* PROJECT GROUPS */}
        {groupRooms.length > 0 && (
          <div className="mb-3">
            <p className="text-muted-foreground mb-1 px-3 text-[10px] font-semibold tracking-wider uppercase">
              Project Groups
            </p>
            {groupRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={String(room.id) === activeRoomId}
                currentEmployeeId={currentEmployeeId}
                onSelect={onRoomSelect}
              />
            ))}
          </div>
        )}

        {/* DIRECT MESSAGES */}
        {dmRooms.length > 0 && (
          <div className="mb-3">
            <p className="text-muted-foreground mb-1 px-3 text-[10px] font-semibold tracking-wider uppercase">
              Direct Messages
            </p>
            {dmRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={String(room.id) === activeRoomId}
                currentEmployeeId={currentEmployeeId}
                onSelect={onRoomSelect}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredRooms.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquare className="text-muted-foreground/40 h-8 w-8" />
            <p className="text-muted-foreground text-xs">No rooms found</p>
          </div>
        )}
      </div>

      {/* New DM button */}
      <div className="border-t p-3">
        <Sheet
          open={dmSheetOpen}
          onOpenChange={(open) => {
            setDmSheetOpen(open);
            if (!open) setDmSearch('');
          }}
        >
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 text-xs"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5" />
              New Message
            </Button>
          </SheetTrigger>

          <SheetContent className="flex flex-col gap-0 overflow-hidden p-0">
            {/* Header — extra right padding for the built-in close button */}
            <SheetHeader className="border-b px-5 pt-5 pr-14 pb-4">
              <SheetTitle>New Message</SheetTitle>
              <SheetDescription className="text-xs">
                Start a direct conversation with a colleague.
              </SheetDescription>
            </SheetHeader>

            {/* Search */}
            <div className="border-b px-4 py-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                <Input
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="pr-8 pl-9"
                  autoFocus
                />
                {dmSearch && (
                  <button
                    onClick={() => setDmSearch('')}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {dmSearch && (
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {filteredEmployees.length === 0
                    ? 'No results'
                    : `${filteredEmployees.length} ${filteredEmployees.length === 1 ? 'person' : 'people'} found`}
                </p>
              )}
            </div>

            {/* Scrollable employee list */}
            <div className="flex-1 overflow-y-auto py-1">
              {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
                    <Users className="text-muted-foreground/50 h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {dmSearch ? 'No results found' : 'No colleagues yet'}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {dmSearch
                        ? `No one matches "${dmSearch}"`
                        : 'Employees will appear here once added.'}
                    </p>
                  </div>
                </div>
              ) : (
                sortedLetters.map((letter) => (
                  <div key={letter}>
                    {/* Sticky alphabetical section header */}
                    <div className="bg-background/95 sticky top-0 z-10 px-4 py-1.5 backdrop-blur-sm">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                        {letter}
                      </span>
                    </div>

                    {groupedEmployees[letter].map((emp) => {
                      const initials = getInitials(emp.name);
                      const isPending = pendingEmployeeId === emp.id;
                      return (
                        <button
                          key={emp.id}
                          onClick={() => emp.id && handleNewDm(emp.id)}
                          disabled={createDm.isPending}
                          className="group hover:bg-muted flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors disabled:cursor-wait disabled:opacity-60"
                        >
                          <div
                            className={`flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full text-sm font-semibold ${getAvatarColor(emp.name)}`}
                          >
                            {emp.profilePicture?.file ? (
                              <Image
                                src={emp.profilePicture.file}
                                alt={emp.name}
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {emp.name}
                            </p>
                            {emp.designation && (
                              <p className="text-muted-foreground truncate text-xs">
                                {emp.designation}
                              </p>
                            )}
                            {emp.email && (
                              <p className="text-muted-foreground/60 truncate text-[11px]">
                                {emp.email}
                              </p>
                            )}
                          </div>

                          {isPending ? (
                            <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
