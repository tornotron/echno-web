'use client';

import { use } from 'react';
import { ChatRoomView } from '@/features/chat/components/chat-room-view';

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = use(params);
  const id = Number.parseInt(roomId, 10);

  if (Number.isNaN(id)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Invalid room ID.</p>
      </div>
    );
  }

  return <ChatRoomView roomId={id} />;
}
