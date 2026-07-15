'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
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
import { ChatRoomHeader } from './chat-room-header';
import { ChatMessageList } from './chat-message-list';
import { ChatComposer } from './chat-composer';

interface ChatRoomViewProps {
  roomId: number;
}

export function ChatRoomView({ roomId }: ChatRoomViewProps) {
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );

  const { data: room, isLoading: roomLoading } = useChatRoom(roomId);
  const { data: messages = [], isLoading: messagesLoading } =
    useChatMessages(roomId);
  const { data: user } = useUser();
  const { data: userEmployees = [] } = useUserEmployees();

  // Fetch tasks and issues from the room's project (for @Task / @Issue mentions)
  const { data: projectTasks = [] } = useTasksByProject(room?.projectId);
  const { data: projectIssues = [] } = useIssuesByProject(room?.projectId);

  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const toggleReaction = useToggleReaction();
  const markAsRead = useMarkRoomAsRead();

  // Find current employee ID (matches user's default organization)
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
        <p className="text-muted-foreground text-sm">Loading room…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Room not found.</p>
      </div>
    );
  }

  const isAiRoom = room.type === ChatRoomType.ai;

  return (
    <div className="flex h-full flex-col">
      <ChatRoomHeader room={room} />

      {isAiRoom ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Bot className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI Assistant</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Your intelligent project assistant is coming soon. It will help
              you query project data, summarize reports, and answer questions
              about your organization.
            </p>
          </div>
        </div>
      ) : (
        <>
          <ChatMessageList
            messages={messages}
            currentEmployeeId={currentEmployeeId}
            onReply={setReplyTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={handleReact}
            isLoading={messagesLoading}
          />

          <ChatComposer
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
