'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { ChevronDown, CornerUpLeft, Pencil, Trash2, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatMessage } from '@/types/chat';
import {
  parseMentions,
  stripMentions,
} from '@/features/chat/utils/message-parser';
import { ChatEntityMentionCard } from '../chat-entity-mention-card';

// ── Compact message content ──────────────────────────────────────────

function CompactMessageContent({ content }: { content: string }) {
  const segments = parseMentions(content);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.text}</span>;
        if (seg.type === 'mention') {
          return (
            <span
              key={i}
              className="bg-primary/15 text-primary/90 dark:text-primary rounded px-0.5 font-semibold"
            >
              @{seg.name}
            </span>
          );
        }
        if (seg.type === 'entity') {
          return (
            <span key={i} className="inline-block align-middle">
              <ChatEntityMentionCard
                label={seg.label}
                entityType={seg.entityType}
                entityId={seg.entityId}
              />
            </span>
          );
        }
        return null;
      })}
    </>
  );
}

// ── Quick reactions ──────────────────────────────────────────────────

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'];

// ── Compact message item ─────────────────────────────────────────────

interface CompactMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  isGrouped?: boolean;
  onReply: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
}

function CompactMessageItem({
  message,
  isOwn,
  isGrouped,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: CompactMessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const senderName = message.sender?.name ?? `User ${message.senderId}`;
  const avatarSrc = message.sender?.profilePicture?.file;
  const initials = senderName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const replyToName =
    message.replyTo?.sender?.name ??
    (message.replyTo ? `User ${message.replyTo.senderId}` : '');
  const replyToPreview = message.replyTo
    ? stripMentions(message.replyTo.content)
    : '';

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setHovered(false);
      setShowReactions(false);
    }, 100);
  };

  if (message.isDeleted) {
    return (
      <div className="px-3 py-0.5">
        <span className="text-muted-foreground/70 ml-6 text-[9px] italic">
          This message was deleted
        </span>
      </div>
    );
  }

  // ── Grouped (continuation) ────────────────────────────────────
  if (isGrouped) {
    return (
      <div
        className={`group relative flex gap-1.5 px-3 py-0.5 transition-colors ${
          hovered ? 'bg-muted/50' : ''
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Timestamp gutter on hover */}
        <div className="flex w-5 shrink-0 items-center justify-end">
          <span
            className={`text-muted-foreground text-[8px] tabular-nums transition-opacity ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {format(message.createdAt, 'h:mm')}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-[10px] leading-snug wrap-break-word whitespace-pre-wrap">
            <CompactMessageContent content={message.content} />
            {message.isEdited && (
              <span className="text-muted-foreground ml-1 text-[8px]">
                (edited)
              </span>
            )}
          </p>

          {/* Compact reactions */}
          {message.reactions.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-0.5">
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(message.id, r.emoji)}
                  className="bg-muted/60 hover:bg-muted inline-flex items-center gap-0.5 rounded border px-1 py-0 text-[8px]"
                >
                  <span className="leading-none">{r.emoji}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {r.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover actions — fewer buttons, smaller */}
        {hovered && (
          <div className="bg-background absolute -top-2.5 right-2 z-10 flex items-center gap-0.5 rounded border p-0.5 shadow-sm">
            <CompactActions
              message={message}
              isOwn={isOwn}
              showReactions={showReactions}
              setShowReactions={setShowReactions}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
            />
          </div>
        )}
      </div>
    );
  }

  // ── First in group ────────────────────────────────────────────
  return (
    <div
      className={`group relative flex gap-1.5 px-3 pt-2 pb-0.5 transition-colors ${
        hovered ? 'bg-muted/50' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar — smaller */}
      <Avatar className="mt-0.5 h-5 w-5 shrink-0">
        <AvatarImage src={avatarSrc} alt={senderName} />
        <AvatarFallback className="text-[8px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {/* Reply quote — compact */}
        {message.replyTo && (
          <div className="text-muted-foreground mb-0.5 flex items-center gap-1 text-[8px]">
            <CornerUpLeft className="h-2 w-2 shrink-0" />
            <span className="text-foreground/90 font-semibold">
              {replyToName}
            </span>
            <span className="truncate">
              {replyToPreview.slice(0, 40)}
              {replyToPreview.length > 40 ? '…' : ''}
            </span>
          </div>
        )}

        {/* Sender + time */}
        <div className="mb-0.5 flex items-baseline gap-1">
          <span className="text-foreground text-[10px] leading-4 font-semibold">
            {senderName}
          </span>
          <span className="text-muted-foreground text-[8px]">
            {format(message.createdAt, 'h:mm a')}
          </span>
        </div>

        {/* Content */}
        <p className="text-foreground text-[10px] leading-snug wrap-break-word whitespace-pre-wrap">
          <CompactMessageContent content={message.content} />
          {message.isEdited && (
            <span className="text-muted-foreground ml-1 text-[8px]">
              (edited)
            </span>
          )}
        </p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact?.(message.id, r.emoji)}
                className="bg-muted/60 hover:bg-muted inline-flex items-center gap-0.5 rounded border px-1 py-0 text-[8px]"
              >
                <span className="leading-none">{r.emoji}</span>
                <span className="text-muted-foreground tabular-nums">
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hovered && (
        <div className="bg-background absolute -top-2.5 right-2 z-10 flex items-center gap-0.5 rounded border p-0.5 shadow-sm">
          <CompactActions
            message={message}
            isOwn={isOwn}
            showReactions={showReactions}
            setShowReactions={setShowReactions}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
          />
        </div>
      )}
    </div>
  );
}

// ── Compact action buttons ───────────────────────────────────────────

function CompactActions({
  message,
  isOwn,
  showReactions,
  setShowReactions,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  message: ChatMessage;
  isOwn: boolean;
  showReactions: boolean;
  setShowReactions: (v: boolean) => void;
  onReply: (m: ChatMessage) => void;
  onEdit?: (m: ChatMessage) => void;
  onDelete?: (m: ChatMessage) => void;
  onReact?: (id: number, emoji: string) => void;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      {/* Reaction picker */}
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-sm"
              onClick={() => setShowReactions(!showReactions)}
            >
              <Smile className="text-muted-foreground h-2.5 w-2.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[9px]">
            React
          </TooltipContent>
        </Tooltip>

        {showReactions && (
          <div className="bg-background absolute right-0 bottom-full mb-1 flex items-center gap-0.5 rounded-lg border p-0.5 shadow-lg">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact?.(message.id, emoji);
                  setShowReactions(false);
                }}
                className="hover:bg-muted rounded p-0.5 text-xs hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reply */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-sm"
            onClick={() => onReply(message)}
          >
            <CornerUpLeft className="text-muted-foreground h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[9px]">
          Reply
        </TooltipContent>
      </Tooltip>

      {/* Edit (own only) */}
      {isOwn && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-sm"
              onClick={() => onEdit(message)}
            >
              <Pencil className="text-muted-foreground h-2.5 w-2.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[9px]">
            Edit
          </TooltipContent>
        </Tooltip>
      )}

      {/* Delete (own only) */}
      {isOwn && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-5 w-5 rounded-sm"
              onClick={() => onDelete(message)}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[9px]">
            Delete
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}

// ── Compact message list ─────────────────────────────────────────────

interface FloatingChatMessageListProps {
  messages: ChatMessage[];
  currentEmployeeId: number;
  onReply: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
  isLoading?: boolean;
}

const GROUP_THRESHOLD_MS = 5 * 60 * 1000;

function CompactDateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className="bg-border h-px flex-1" />
      <span className="text-muted-foreground text-[8px] font-semibold tracking-wider uppercase">
        {format(date, 'MMM d, yyyy')}
      </span>
      <div className="bg-border h-px flex-1" />
    </div>
  );
}

export function FloatingChatMessageList({
  messages,
  currentEmployeeId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  isLoading,
}: FloatingChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const isNearBottom = useRef(true);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = dist < 100;
    setShowScrollFab(dist > 100);
  }, []);

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex animate-pulse gap-2">
                <div className="bg-muted h-7 w-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="bg-muted h-2.5 w-20 rounded" />
                  <div className="bg-muted h-3 w-3/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <div>
          <p className="text-2xl">💬</p>
          <p className="text-foreground mt-1 text-[10px] font-semibold">
            No messages yet
          </p>
          <p className="text-muted-foreground text-[9px]">
            Be the first to say something!
          </p>
        </div>
      </div>
    );
  }

  // Build items with date separators
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
      !msg.replyTo &&
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
        <div className="flex flex-col pt-1 pb-1">
          {items.map((item, i) => {
            if (item.type === 'date') {
              return (
                <CompactDateSeparator
                  key={`${item.key}-${i}`}
                  date={item.date}
                />
              );
            }
            return (
              <CompactMessageItem
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
          className="absolute right-2 bottom-2 h-7 w-7 rounded-full shadow-md"
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowScrollFab(false);
          }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
