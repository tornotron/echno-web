// hooks/chat/use-mention.ts
//
// Manages @mention state for the chat composer.
// Detects three trigger patterns after '@':
//   @<query>        → member mention (filters room participants)
//   @Task <query>   → task entity mention (filters project tasks)
//   @Issue <query>  → issue entity mention (filters project issues)

import { useState, useCallback, useMemo, RefObject } from 'react';
import { ChatParticipant } from '@/types/chat';
import { ChatEntityType } from '@/types/chat';
import { Task } from '@/types/task/task';
import { Issue } from '@/types/issue/issue';
import {
  buildMentionToken,
  buildEntityToken,
} from '@/features/chat/utils/message-parser';

// ─── Public types ───────────────────────────────────────────────────────────

export type MentionMode = 'member' | 'task' | 'issue';

export interface MentionMember {
  kind: 'member';
  employeeId: number;
  name: string;
  avatar?: string;
}

export interface MentionTask {
  kind: 'task';
  id: number;
  title: string;
}

export interface MentionIssue {
  kind: 'issue';
  id: number;
  title: string;
}

export type MentionItem = MentionMember | MentionTask | MentionIssue;

export interface UseMentionOptions {
  participants: ChatParticipant[];
  tasks: Task[];
  issues: Issue[];
}

export interface UseMentionReturn {
  /** Whether the mention popup should be visible */
  open: boolean;
  /** Current mention mode */
  mode: MentionMode;
  /** Filtered items to display in the popup */
  items: MentionItem[];
  /** Currently highlighted index */
  activeIndex: number;
  /** Call on every value change from the textarea */
  onValueChange: (value: string, cursorPos: number) => void;
  /** Select the item at the given index (or activeIndex) */
  selectItem: (index?: number) => void;
  /** Move highlight up */
  moveUp: () => void;
  /** Move highlight down */
  moveDown: () => void;
  /** Dismiss the popup */
  dismiss: () => void;
  /** The raw search query inside the trigger */
  query: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function findTrigger(value: string, cursorPos: number) {
  // Walk backwards from cursor to find an unescaped '@'
  const textBeforeCursor = value.slice(0, cursorPos);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex === -1) return null;

  // '@' must be at start of input or preceded by whitespace / newline
  if (atIndex > 0 && !/\s/.test(textBeforeCursor[atIndex - 1])) return null;

  const after = textBeforeCursor.slice(atIndex + 1); // text between @ and cursor

  // Determine mode from prefix
  const taskMatch = after.match(/^Task\s*(.*)/i);
  if (taskMatch) {
    return {
      mode: 'task' as MentionMode,
      query: taskMatch[1],
      triggerStart: atIndex,
    };
  }

  const issueMatch = after.match(/^Issue\s*(.*)/i);
  if (issueMatch) {
    return {
      mode: 'issue' as MentionMode,
      query: issueMatch[1],
      triggerStart: atIndex,
    };
  }

  return { mode: 'member' as MentionMode, query: after, triggerStart: atIndex };
}

function filterMembers(
  participants: ChatParticipant[],
  query: string
): MentionMember[] {
  const q = query.toLowerCase();
  return participants
    .filter((p) => {
      const name = p.employee?.name ?? '';
      return name.toLowerCase().includes(q);
    })
    .slice(0, 8)
    .map((p) => ({
      kind: 'member' as const,
      employeeId: p.employeeId,
      name: p.employee?.name ?? `Employee ${p.employeeId}`,
      avatar: p.employee?.profilePicture?.file,
    }));
}

function filterTasks(tasks: Task[], query: string): MentionTask[] {
  const q = query.toLowerCase();
  return tasks
    .filter((t) => t.title.toLowerCase().includes(q))
    .slice(0, 8)
    .map((t) => ({
      kind: 'task' as const,
      id: t.id,
      title: t.title,
    }));
}

function filterIssues(issues: Issue[], query: string): MentionIssue[] {
  const q = query.toLowerCase();
  return issues
    .filter((i) => i.title.toLowerCase().includes(q))
    .slice(0, 8)
    .map((i) => ({
      kind: 'issue' as const,
      id: i.id!,
      title: i.title,
    }));
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMention(
  options: UseMentionOptions,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  setValue: (v: string) => void
) {
  const { participants, tasks, issues } = options;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<MentionMode>('member');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(0);

  const items = useMemo<MentionItem[]>(() => {
    if (!open) return [];
    switch (mode) {
      case 'member': {
        return filterMembers(participants, query);
      }
      case 'task': {
        return filterTasks(tasks, query);
      }
      case 'issue': {
        return filterIssues(issues, query);
      }
      default: {
        return [];
      }
    }
  }, [open, mode, query, participants, tasks, issues]);

  const onValueChange = useCallback((newValue: string, cursorPos: number) => {
    const trigger = findTrigger(newValue, cursorPos);
    if (trigger) {
      setOpen(true);
      setMode(trigger.mode);
      setQuery(trigger.query);
      setTriggerStart(trigger.triggerStart);
      setActiveIndex(0);
    } else {
      setOpen(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const selectItem = useCallback(
    (index?: number) => {
      const idx = index ?? activeIndex;
      const item = items[idx];
      if (!item) return;

      // Build the token to insert
      let token: string;
      if (item.kind === 'member') {
        token = buildMentionToken(item.name, item.employeeId);
      } else if (item.kind === 'task') {
        token = buildEntityToken(item.title, ChatEntityType.task, item.id);
      } else {
        token = buildEntityToken(item.title, ChatEntityType.issue, item.id);
      }

      // Replace the trigger text with the token
      const cursorPos = textareaRef.current?.selectionStart ?? value.length;
      const before = value.slice(0, triggerStart);
      const after = value.slice(cursorPos);
      const newValue = `${before}${token} ${after}`;
      setValue(newValue);

      // Set cursor after the inserted token + space
      const newCursorPos = before.length + token.length + 1;
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(newCursorPos, newCursorPos);
        }
      });

      setOpen(false);
    },
    [activeIndex, items, triggerStart, value, setValue, textareaRef]
  );

  const moveUp = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const moveDown = useCallback(() => {
    setActiveIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  return {
    open,
    mode,
    items,
    activeIndex,
    onValueChange,
    selectItem,
    moveUp,
    moveDown,
    dismiss,
    query,
  } satisfies UseMentionReturn;
}
