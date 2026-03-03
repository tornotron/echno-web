'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types/chat';
import { ChatMessageItem } from './chat-message-item';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentEmployeeId: number;
  onReply: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
  isLoading?: boolean;
}

/** Messages within this window from the same sender are visually grouped */
const GROUP_THRESHOLD_MS = 5 * 60 * 1000;

function DateSeparator({ date }: { date: Date }) {
  const label = format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="bg-border h-px flex-1" />
      <span className="text-muted-foreground text-[11px] font-semibold">
        {label}
      </span>
      <div className="bg-border h-px flex-1" />
    </div>
  );
}

function MessageSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex animate-pulse gap-4 px-4 py-2">
      <div className="bg-muted h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="bg-muted h-3.5 w-24 rounded" />
          <div className="bg-muted h-3 w-12 rounded" />
        </div>
        <div className={`bg-muted h-4 rounded ${wide ? 'w-4/5' : 'w-3/5'}`} />
        <div className={`bg-muted h-4 rounded ${wide ? 'w-3/5' : 'w-2/5'}`} />
      </div>
    </div>
  );
}

export function ChatMessageList({
  messages,
  currentEmployeeId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  isLoading,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const isNearBottom = useRef(true);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = distFromBottom < 150;
    setShowScrollFab(distFromBottom > 150);
  }, []);

  // Auto-scroll only when user is already near the bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Scroll to bottom on initial load
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [isLoading]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollFab(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col py-2">
            <MessageSkeleton wide />
            <MessageSkeleton />
            <MessageSkeleton wide />
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full text-2xl">
          💬
        </div>
        <div>
          <p className="text-sm font-medium">No messages yet</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Be the first to say something!
          </p>
        </div>
      </div>
    );
  }

  // Build render items with date separators and grouping flags
  type Item =
    | { type: 'date'; date: Date; key: string }
    | { type: 'message'; message: ChatMessage; isGrouped: boolean };

  const items: Item[] = [];
  let lastDate: Date | null = null;
  let lastMsg: ChatMessage | null = null;

  for (const msg of messages) {
    if (!lastDate || !isSameDay(lastDate, msg.createdAt)) {
      items.push({
        type: 'date',
        date: msg.createdAt,
        key: msg.createdAt.toDateString(),
      });
      lastDate = msg.createdAt;
      lastMsg = null;
    }

    const isGrouped =
      lastMsg !== null &&
      lastMsg.senderId === msg.senderId &&
      !msg.replyTo && // replies always start a new block
      msg.createdAt.getTime() - lastMsg.createdAt.getTime() <
        GROUP_THRESHOLD_MS;

    items.push({ type: 'message', message: msg, isGrouped });
    lastMsg = msg;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={checkScrollPosition}
      >
        <div className="flex flex-col pt-1 pb-2">
          {items.map((item, i) => {
            if (item.type === 'date') {
              return (
                <DateSeparator key={`${item.key}-${i}`} date={item.date} />
              );
            }
            return (
              <ChatMessageItem
                key={item.message.id}
                message={item.message}
                isOwn={item.message.senderId === currentEmployeeId}
                isGrouped={item.isGrouped}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollFab && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute right-4 bottom-4 rounded-full shadow-md"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
