'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { CornerUpLeft, Pencil, Trash2, Smile, Paperclip } from 'lucide-react';

import { Button } from '@/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import { ChatMessage } from '@/types/chat';
import {
  Attachment,
  AttachmentType,
  formatFileSize,
} from '@tornotron/echno-core/attachment/types';
import {
  parseMentions,
  stripMentions,
  getAvatarColor,
} from '@/features/chat/utils/message-parser';
import { ChatEntityMentionCard } from './chat-entity-mention-card';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  /** True when this is a continuation from the same sender within 5 min */
  isGrouped?: boolean;
  onReply: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'];

function MessageContent({ content }: { content: string }) {
  const segments = parseMentions(content);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.text}</span>;
        if (seg.type === 'mention') {
          return (
            <span
              key={i}
              className="cursor-pointer rounded-[3px] bg-blue-500/15 px-0.5 font-medium text-blue-600 hover:bg-blue-500/25 hover:underline dark:text-blue-400"
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

function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((att) =>
        att.fileType === AttachmentType.image ? (
          <a
            key={att.id}
            href={att.file}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-md border"
          >
            <Image
              src={att.file}
              alt={att.fileName}
              width={220}
              height={160}
              unoptimized
              className="max-h-40 w-auto object-cover"
            />
          </a>
        ) : (
          <a
            key={att.id}
            href={att.file}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-background hover:bg-muted flex max-w-[260px] items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            <Paperclip className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">{att.fileName}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {formatFileSize(att.fileSize)}
            </span>
          </a>
        )
      )}
    </div>
  );
}

export function ChatMessageItem({
  message,
  isOwn,
  isGrouped,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: ChatMessageItemProps) {
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

  const timeString = format(message.createdAt, 'MM/dd/yyyy h:mm a');
  const shortTime = format(message.createdAt, 'h:mm a');

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
  // On touch devices: tap the message to reveal the action bar, auto-hide after 3s
  const handleTouchStart = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered((prev) => {
      if (prev) {
        // Second tap dismisses
        setShowReactions(false);
        return false;
      }
      leaveTimer.current = setTimeout(() => {
        setHovered(false);
        setShowReactions(false);
      }, 3000);
      return true;
    });
  };

  // ── Deleted message ─────────────────────────────────────────────────
  if (message.isDeleted) {
    return (
      <div className="flex items-center px-4 py-1">
        <div className="text-muted-foreground/40 ml-14 text-[13px] italic">
          This message was deleted
        </div>
      </div>
    );
  }

  // ── Grouped (continuation) message ──────────────────────────────────
  if (isGrouped) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={`group relative flex gap-4 px-4 py-1 transition-colors duration-75 ${
            hovered ? 'bg-muted/50' : ''
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
        >
          {/* Timestamp gutter — appears on hover */}
          <div className="flex w-10 shrink-0 items-center justify-end">
            <span
              className={`text-muted-foreground text-[10px] tabular-nums transition-opacity duration-75 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {format(message.createdAt, 'h:mm')}
            </span>
          </div>

          {/* Message body */}
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-[15px] leading-5.5 wrap-break-word whitespace-pre-wrap">
              <MessageContent content={message.content} />
              {message.isEdited && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground/50 ml-1 cursor-default text-[10px]">
                      (edited)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {message.editedAt
                      ? format(message.editedAt, 'MM/dd/yyyy h:mm a')
                      : 'Edited'}
                  </TooltipContent>
                </Tooltip>
              )}
            </p>

            {/* Attachments */}
            {message.attachments && (
              <MessageAttachments attachments={message.attachments} />
            )}

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {message.reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => onReact?.(message.id, reaction.emoji)}
                    className="bg-background inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors hover:border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <span className="text-sm leading-none">
                      {reaction.emoji}
                    </span>
                    <span className="text-muted-foreground font-medium tabular-nums">
                      {reaction.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hover action bar */}
          <div
            className={`bg-background absolute -top-3.5 right-4 z-10 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm transition-all duration-100 ${
              hovered
                ? 'pointer-events-auto scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            }`}
          >
            <ActionButtons
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
        </div>
      </TooltipProvider>
    );
  }

  // ── First message in a group ────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`group relative flex gap-4 px-4 pt-5 pb-1 transition-colors duration-75 ${
          hovered ? 'bg-muted/50' : ''
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        {/* Avatar */}
        <div
          className={`mt-0.5 flex h-10 w-10 flex-none cursor-pointer items-center justify-center self-start overflow-hidden rounded-full text-xs font-semibold ${getAvatarColor(senderName)}`}
        >
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={senderName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Message body */}
        <div className="min-w-0 flex-1">
          {/* Reply quote */}
          {message.replyTo && (
            <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs">
              <CornerUpLeft className="h-3 w-3 shrink-0" />
              <span className="text-foreground/70 font-medium">
                {replyToName}
              </span>
              <span className="truncate">
                {replyToPreview.slice(0, 60)}
                {replyToPreview.length > 60 ? '…' : ''}
              </span>
            </div>
          )}

          {/* Sender + timestamp */}
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-foreground cursor-pointer text-[15px] leading-5.5 font-semibold hover:underline">
              {senderName}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-default text-xs">
                  {shortTime}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{timeString}</TooltipContent>
            </Tooltip>
          </div>

          {/* Message content */}
          <p className="text-foreground text-[15px] leading-5.5 wrap-break-word whitespace-pre-wrap">
            <MessageContent content={message.content} />
            {message.isEdited && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground/50 ml-1 cursor-default text-[10px]">
                    (edited)
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {message.editedAt
                    ? format(message.editedAt, 'MM/dd/yyyy h:mm a')
                    : 'Edited'}
                </TooltipContent>
              </Tooltip>
            )}
          </p>

          {/* Attachments */}
          {message.attachments && (
            <MessageAttachments attachments={message.attachments} />
          )}

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className="bg-background inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors hover:border-blue-500/50 hover:bg-blue-500/10"
                >
                  <span className="text-sm leading-none">{reaction.emoji}</span>
                  <span className="text-muted-foreground font-medium tabular-nums">
                    {reaction.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover action bar */}
        <div
          className={`bg-background absolute -top-3.5 right-4 z-10 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm transition-all duration-100 ${
            hovered
              ? 'pointer-events-auto scale-100 opacity-100'
              : 'pointer-events-none scale-95 opacity-0'
          }`}
        >
          <ActionButtons
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
      </div>
    </TooltipProvider>
  );
}

// ── Shared action buttons ───────────────────────────────────────────────
function ActionButtons({
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
    <>
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setShowReactions(!showReactions)}
            >
              <Smile className="text-muted-foreground h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Reaction</TooltipContent>
        </Tooltip>

        {/* Quick-reaction picker */}
        <div
          className={`bg-background absolute right-0 bottom-full mb-1 flex items-center gap-0.5 rounded-lg border p-1 shadow-lg transition-all duration-100 ${
            showReactions
              ? 'pointer-events-auto scale-100 opacity-100'
              : 'pointer-events-none scale-90 opacity-0'
          }`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact?.(message.id, emoji);
                setShowReactions(false);
              }}
              className="hover:bg-muted rounded-md p-1.5 text-lg transition-transform duration-75 hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm"
            onClick={() => onReply(message)}
          >
            <CornerUpLeft className="text-muted-foreground h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reply</TooltipContent>
      </Tooltip>

      {isOwn && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => onEdit(message)}
            >
              <Pencil className="text-muted-foreground h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      )}

      {isOwn && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-7 w-7 rounded-sm"
              onClick={() => onDelete(message)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
