'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
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
import { ChatMentionPopup } from './chat-mention-popup';

interface ChatComposerProps {
  onSend: (content: string, replyToId?: number, mentions?: number[]) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  editContent?: string;
  onCancelEdit?: () => void;
  /** Room participants for @member mentions */
  participants?: ChatParticipant[];
  /** Project tasks for @Task mentions */
  tasks?: Task[];
  /** Project issues for @Issue mentions */
  issues?: Issue[];
}

export function ChatComposer({
  onSend,
  replyTo,
  onCancelReply,
  disabled,
  placeholder = 'Message… (type @ to mention)',
  editContent,
  onCancelEdit,
  participants = [],
  tasks = [],
  issues = [],
}: ChatComposerProps) {
  const [value, setValue] = useState(editContent ?? '');
  const [prevEditContent, setPrevEditContent] = useState(editContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
    // When mention popup is open, intercept navigation keys
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
    <div className="bg-background border-t px-4 py-3">
      {/* Reply preview strip */}
      {replyTo && (
        <div className="border-primary/50 bg-muted mb-2 flex items-center gap-2 rounded-md border-l-2 py-1.5 pr-2 pl-2">
          <div className="text-muted-foreground flex-1 truncate text-xs">
            <span className="text-foreground font-medium">
              Replying to {replyTo.sender?.name ?? `User ${replyTo.senderId}`}:
            </span>{' '}
            {replyToPreview.slice(0, 100)}
            {replyToPreview.length > 100 ? '…' : ''}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Edit mode indicator */}
      {isEditing && (
        <div className="mb-2 flex items-center gap-2 rounded-md border-l-2 border-yellow-500/60 bg-yellow-50 py-1.5 pr-2 pl-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <span className="flex-1 font-medium">Editing message</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 text-yellow-700 hover:text-yellow-900 dark:text-yellow-400"
            onClick={onCancelEdit}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input row */}
      <div className="relative flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground h-9 w-9 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          aria-hidden="true"
        />

        {/* Mention popup (positioned above the textarea) */}
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
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none overflow-hidden"
          style={{ minHeight: '36px', maxHeight: '160px' }}
        />

        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-muted-foreground/60 mt-1.5 text-[11px]">
        <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">
          Enter
        </kbd>{' '}
        send ·{' '}
        <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">
          Shift+Enter
        </kbd>{' '}
        newline ·{' '}
        <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">
          @
        </kbd>{' '}
        mention
      </p>
    </div>
  );
}
