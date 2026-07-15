'use client';

import { useState } from 'react';
import { ArrowLeft, Bot, Folder, User, Users } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/shadcn/avatar';
import { Button } from '@/components/shadcn/button';
import { useChatRoom } from '@/hooks/chat/use-chat-rooms';
import { useChatMessages } from '@/hooks/chat/use-chat-messages';
import {
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useToggleReaction,
  useMarkRoomAsRead,
} from '@/hooks/chat/use-chat-mutations';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { useTasksByProject } from '@tornotron/echno-core/task/hooks';
import { useIssuesByProject } from '@tornotron/echno-core/issue/hooks';
import { ChatMessage, ChatRoomType } from '@/types/chat';
import { FloatingChatMessageList } from './floating-chat-message-list';
import { FloatingChatComposer } from './floating-chat-composer';

interface FloatingChatRoomViewProps {
  roomId: number;
  onBack: () => void;
}

export function FloatingChatRoomView({
  roomId,
  onBack,
}: FloatingChatRoomViewProps) {
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );

  const { data: room, isLoading: roomLoading } = useChatRoom(roomId);
  const { data: messages = [], isLoading: messagesLoading } =
    useChatMessages(roomId);
  const { data: user } = useUser();
  const { data: userEmployees = [] } = useUserEmployees();

  const { data: projectTasks = [] } = useTasksByProject(room?.projectId);
  const { data: projectIssues = [] } = useIssuesByProject(room?.projectId);

  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const toggleReaction = useToggleReaction();
  const markAsRead = useMarkRoomAsRead();

  const currentEmployee = userEmployees.find(
    (e) => e.organizationId === user?.defaultOrganizationId
  );
  const currentEmployeeId = currentEmployee?.id ?? 1;

  const handleSend = (
    content: string,
    replyToId?: number,
    mentions?: number[]
  ) => {
    if (editingMessage) {
      editMessage.mutate({ id: editingMessage.id, content, roomId });
      setEditingMessage(null);
    } else {
      sendMessage.mutate({ roomId, data: { content, replyToId, mentions } });
      markAsRead.mutate(roomId);
    }
    setReplyTo(null);
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessage(message);
    setReplyTo(null);
  };

  const handleDelete = (message: ChatMessage) => {
    deleteMessage.mutate({ id: message.id, roomId });
  };

  const handleReact = (messageId: number, emoji: string) => {
    toggleReaction.mutate({ messageId, emoji, roomId });
  };

  if (roomLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-[10px]">Loading…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-[10px]">Room not found.</p>
      </div>
    );
  }

  const participants = room.participants ?? [];
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

  // For DMs, show the other participant's avatar
  const otherParticipant =
    room.type === ChatRoomType.direct
      ? (participants.find((p) => p.employeeId !== currentEmployeeId) ??
        participants[0])
      : null;

  const isAiRoom = room.type === ChatRoomType.ai;

  return (
    <div className="flex h-full flex-col">
      {/* Compact header */}
      <div className="bg-background flex h-9 shrink-0 items-center gap-1.5 border-b px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>

        {room.type === ChatRoomType.direct && otherParticipant ? (
          <Avatar className="size-5 shrink-0">
            <AvatarImage
              src={otherParticipant.employee?.profilePicture?.file}
              alt={roomName}
            />
            <AvatarFallback className="text-[8px] font-medium">
              {roomName
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <RoomIcon className="text-muted-foreground h-3 w-3 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-[10px] font-semibold tracking-tight">
            {roomName}
          </h3>
        </div>

        {/* Participant count (no members panel — limitation) */}
        {room.type !== ChatRoomType.ai && (
          <div className="text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="text-[8px]">{participants.length}</span>
          </div>
        )}
      </div>

      {isAiRoom ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-foreground text-[11px] font-bold">
              AI Assistant
            </h3>
            <p className="text-muted-foreground mt-1 text-[9px]">
              Coming soon. Will help you query project data and summarize
              reports.
            </p>
          </div>
        </div>
      ) : (
        <>
          <FloatingChatMessageList
            messages={messages}
            currentEmployeeId={currentEmployeeId}
            onReply={setReplyTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={handleReact}
            isLoading={messagesLoading}
          />

          <FloatingChatComposer
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editContent={editingMessage?.content}
            onCancelEdit={() => setEditingMessage(null)}
            disabled={sendMessage.isPending || editMessage.isPending}
            participants={room.participants}
            tasks={projectTasks}
            issues={projectIssues}
          />
        </>
      )}
    </div>
  );
}
