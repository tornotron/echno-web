'use client';

import { useState } from 'react';
import {
  Users,
  Bot,
  Folder,
  User,
  Search,
  X,
  Shield,
  Crown,
  UserCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ChatRoom, ChatRoomType } from '@/types/chat';
import {
  getChatParticipantRoleLabel,
  ChatParticipantRole,
} from '@/types/chat/chat-participant-role';

interface ChatRoomHeaderProps {
  room: ChatRoom;
}

const MAX_VISIBLE_AVATARS = 4;

export function ChatRoomHeader({ room }: ChatRoomHeaderProps) {
  const [memberSearch, setMemberSearch] = useState('');
  const participants = room.participants ?? [];
  const visibleParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = Math.max(0, participants.length - MAX_VISIBLE_AVATARS);

  const RoomIcon =
    room.type === ChatRoomType.ai
      ? Bot
      : room.type === ChatRoomType.group
        ? Folder
        : User;

  const roomName =
    room.name ??
    (room.type === ChatRoomType.direct
      ? participants
          .map((p) => p.employee?.name ?? `User ${p.employeeId}`)
          .join(', ')
      : `Room ${room.id}`);

  return (
    <div className="bg-background flex h-14 shrink-0 items-center justify-between border-b px-4">
      {/* Left: room name + icon */}
      <div className="flex min-w-0 items-center gap-2">
        <RoomIcon className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{roomName}</h2>
          {room.description && (
            <p className="text-muted-foreground truncate text-xs">
              {room.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: participant avatars + members sheet */}
      {room.type !== ChatRoomType.ai && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-2"
            >
              {/* Stacked avatars */}
              <div className="flex -space-x-2">
                {visibleParticipants.map((p) => {
                  const name = p.employee?.name ?? `${p.employeeId}`;
                  const initials = name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();
                  return (
                    <Avatar
                      key={p.employeeId}
                      className="border-background h-6 w-6 border-2"
                    >
                      <AvatarImage
                        src={p.employee?.profilePicture?.file}
                        alt={name}
                      />
                      <AvatarFallback className="text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {overflowCount > 0 && (
                  <div className="border-background bg-muted flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-medium">
                    +{overflowCount}
                  </div>
                )}
              </div>
              <Users className="h-4 w-4" />
              <span className="text-xs">{participants.length}</span>
            </Button>
          </SheetTrigger>

          <SheetContent className="flex flex-col gap-0 overflow-hidden p-0">
            {/* Header */}
            <SheetHeader className="border-b px-5 pt-5 pr-14 pb-4">
              <SheetTitle>Members · {participants.length}</SheetTitle>
              <SheetDescription className="text-xs">
                People in this conversation.
              </SheetDescription>
            </SheetHeader>

            {/* Search — shown when there are enough members to warrant it */}
            {participants.length > 5 && (
              <div className="border-b px-4 py-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    className="pr-8 pl-9"
                  />
                  {memberSearch && (
                    <button
                      onClick={() => setMemberSearch('')}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Member list */}
            <div className="flex-1 overflow-y-auto py-1">
              {(() => {
                const filtered = memberSearch.trim()
                  ? participants.filter((p) => {
                      const name = p.employee?.name ?? '';
                      return name
                        .toLowerCase()
                        .includes(memberSearch.toLowerCase());
                    })
                  : participants;

                // Sort: admins first, then alphabetically
                const sorted = filtered.toSorted((a, b) => {
                  if (
                    a.role === ChatParticipantRole.admin &&
                    b.role !== ChatParticipantRole.admin
                  )
                    return -1;
                  if (
                    a.role !== ChatParticipantRole.admin &&
                    b.role === ChatParticipantRole.admin
                  )
                    return 1;
                  const nameA = a.employee?.name ?? '';
                  const nameB = b.employee?.name ?? '';
                  return nameA.localeCompare(nameB);
                });

                if (sorted.length === 0) {
                  return (
                    <div className="flex flex-col items-center gap-3 py-14 text-center">
                      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
                        <Users className="text-muted-foreground/50 h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          No one matches &quot;{memberSearch}&quot;
                        </p>
                      </div>
                    </div>
                  );
                }

                return sorted.map((p) => {
                  const name = p.employee?.name ?? `User ${p.employeeId}`;
                  const email = p.employee?.email;
                  const designation = p.employee?.designation;
                  const initials = name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();
                  const isAdmin = p.role === ChatParticipantRole.admin;
                  const RoleIcon = isAdmin ? Shield : UserCheck;

                  return (
                    <div
                      key={p.employeeId}
                      className="group hover:bg-muted flex items-center gap-3 px-4 py-2.5 transition-colors"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                          src={p.employee?.profilePicture?.file}
                          alt={name}
                        />
                        <AvatarFallback className="text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{name}</p>
                          {isAdmin && (
                            <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                          )}
                        </div>
                        {designation && (
                          <p className="text-muted-foreground truncate text-xs">
                            {designation}
                          </p>
                        )}
                        {email && (
                          <p className="text-muted-foreground/60 truncate text-[11px]">
                            {email}
                          </p>
                        )}
                      </div>

                      <Badge
                        variant={isAdmin ? 'default' : 'outline'}
                        className="shrink-0 gap-1 text-[10px] capitalize"
                      >
                        <RoleIcon className="h-3 w-3" />
                        {getChatParticipantRoleLabel(p.role)}
                      </Badge>
                    </div>
                  );
                });
              })()}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {room.type === ChatRoomType.ai && (
        <Badge variant="secondary" className="text-xs">
          Coming Soon
        </Badge>
      )}
    </div>
  );
}
