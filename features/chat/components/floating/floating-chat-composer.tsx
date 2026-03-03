'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ChatParticipant } from '@/types/chat';
import { Task } from '@/types/task/task';
import { Issue } from '@/types/issue/issue';
import {
  parseMentions,
  stripMentions,
} from '@/features/chat/utils/message-parser';
import { useMention } from '@/hooks/chat/use-mention';
import { ChatMentionPopup } from '../chat-mention-popup';

interface FloatingChatComposerProps {
  onSend: (content: string, replyToId?: number, mentions?: number[]) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  editContent?: string;
  onCancelEdit?: () => void;
  participants?: ChatParticipant[];
  tasks?: Task[];
  issues?: Issue[];
}

export function FloatingChatComposer({
  onSend,
  replyTo,
  onCancelReply,
  disabled,
  editContent,
  onCancelEdit,
  participants = [],
  tasks = [],
  issues = [],
}: FloatingChatComposerProps) {
  const [value, setValue] = useState(editContent ?? '');
  const [prevEditContent, setPrevEditContent] = useState(editContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = editContent !== undefined;
  const replyToPreview = replyTo ? stripMentions(replyTo.content) : '';

  const mention = useMention(
    { participants, tasks, issues },
    textareaRef,
    value,
    setValue
  );

  // Sync when the user starts editing a different message
  if (editContent !== prevEditContent) {
    setPrevEditContent(editContent);
    if (editContent !== undefined) {
      setValue(editContent);
    }
  }

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editContent !== undefined) {
      textareaRef.current?.focus();
    }
  }, [editContent]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Smaller max-height for floating chat
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const segments = parseMentions(trimmed);
    const mentions = segments
      .filter((s) => s.type === 'mention')
      .map((s) => (s as { type: 'mention'; employeeId: number }).employeeId);

    onSend(trimmed, replyTo?.id, mentions);
    setValue('');
    onCancelReply?.();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention.open) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        mention.moveUp();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        mention.moveDown();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        mention.selectItem();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        mention.dismiss();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onCancelReply?.();
      onCancelEdit?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    mention.onValueChange(newVal, e.target.selectionStart ?? newVal.length);
  };

  return (
    <div className="bg-background border-t px-3 py-2">
      {/* Reply preview — compact */}
      {replyTo && (
        <div className="border-primary/70 bg-muted/70 mb-1 flex items-center gap-1 rounded border-l-2 py-0.5 pr-1 pl-1.5">
          <div className="text-muted-foreground flex-1 truncate text-[9px]">
            <span className="text-foreground font-semibold">
              {replyTo.sender?.name ?? `User ${replyTo.senderId}`}:
            </span>{' '}
            {replyToPreview.slice(0, 60)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 shrink-0"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="mb-1 flex items-center gap-1 rounded border-l-2 border-yellow-500/80 bg-yellow-50 py-0.5 pr-1 pl-1.5 text-[9px] text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
          <span className="flex-1 font-semibold">Editing message</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 shrink-0"
            onClick={onCancelEdit}
            aria-label="Cancel edit"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="relative flex items-end gap-1.5">
        {/* Mention popup — positioned above textarea */}
        <ChatMentionPopup
          open={mention.open}
          mode={mention.mode}
          items={mention.items}
          activeIndex={mention.activeIndex}
          onSelect={(idx) => mention.selectItem(idx)}
          query={mention.query}
        />

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message… (@ to mention)"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none overflow-hidden text-[10px] leading-snug"
          style={{ minHeight: '28px', maxHeight: '80px' }}
        />

        <Button
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
