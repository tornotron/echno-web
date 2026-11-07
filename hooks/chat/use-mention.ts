// hooks/chat/use-mention.ts
//
// Manages @mention state for the chat composer.
// Detects four trigger patterns after '@':
//   @<query>         → people, projects, tasks and issues, grouped
//   @Project <query> → projects only
//   @Task <query>    → tasks only
//   @Issue <query>   → issues only

import { useState, useCallback, useMemo, useRef, RefObject } from 'react';
import { ChatEntityType, ChatParticipant } from '@/types/chat';
import {
  MentionMode,
  MentionMember,
  MentionProject,
  MentionTask,
  MentionIssue,
  MentionItem,
  UseMentionOptions,
  UseMentionReturn,
} from '@/types/chat';
import { Project } from '@tornotron/echno-core/project/types';
import { Task } from '@tornotron/echno-core/task/types';
import { Issue } from '@tornotron/echno-core/issue/types';
import {
  buildMentionToken,
  buildEntityToken,
  maskMentionTokens,
} from '@/features/chat/utils/message-parser';

export type {
  MentionMode,
  MentionMember,
  MentionProject,
  MentionTask,
  MentionIssue,
  MentionItem,
  UseMentionOptions,
  UseMentionReturn,
} from '@/types/chat';

const GROUPED_LIMIT = 5;
const SINGLE_KIND_LIMIT = 8;

// ─── Helpers ────────────────────────────────────────────────────────────────

function findTrigger(value: string, cursorPos: number) {
  // Walk backwards from cursor to find an unescaped '@'. A picked mention is
  // already finished, so the '@' inside its token cannot start a new one.
  const textBeforeCursor = maskMentionTokens(value.slice(0, cursorPos));
  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex === -1) return null;

  // '@' must be at start of input or preceded by whitespace / newline
  if (atIndex > 0 && !/\s/.test(textBeforeCursor[atIndex - 1])) return null;

  const after = textBeforeCursor.slice(atIndex + 1); // text between @ and cursor

  // Determine mode from prefix
  const projectMatch = after.match(/^Project\s*(.*)/i);
  if (projectMatch) {
    return {
      mode: 'project' as MentionMode,
      query: projectMatch[1],
      triggerStart: atIndex,
    };
  }

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

  return { mode: 'all' as MentionMode, query: after, triggerStart: atIndex };
}

function filterMembers(
  participants: ChatParticipant[],
  query: string,
  limit: number
): MentionMember[] {
  const q = query.toLowerCase();
  return participants
    .filter((p) => {
      const name = p.employee?.name ?? '';
      return name.toLowerCase().includes(q);
    })
    .slice(0, limit)
    .map((p) => ({
      kind: 'member' as const,
      employeeId: p.employeeId,
      name: p.employee?.name ?? `Employee ${p.employeeId}`,
      avatar: p.employee?.profilePicture?.file,
    }));
}

function filterProjects(
  projects: Project[],
  query: string,
  limit: number
): MentionProject[] {
  const q = query.toLowerCase();
  return projects
    .filter((p) => p.projectName.toLowerCase().includes(q))
    .slice(0, limit)
    .map((p) => ({
      kind: 'project' as const,
      id: p.id,
      name: p.projectName,
    }));
}

function filterTasks(
  tasks: Task[],
  query: string,
  limit: number
): MentionTask[] {
  const q = query.toLowerCase();
  return tasks
    .filter((t) => t.title.toLowerCase().includes(q))
    .slice(0, limit)
    .map((t) => ({
      kind: 'task' as const,
      id: t.id,
      title: t.title,
    }));
}

function filterIssues(
  issues: Issue[],
  query: string,
  limit: number
): MentionIssue[] {
  const q = query.toLowerCase();
  return issues
    .filter((i) => i.title.toLowerCase().includes(q))
    .slice(0, limit)
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
  const { participants, projects, tasks, issues } = options;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<MentionMode>('all');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(0);
  // The '@' the list was closed on with Escape: it stays closed for that one.
  const dismissedTrigger = useRef<number | null>(null);

  const items = useMemo<MentionItem[]>(() => {
    if (!open) return [];
    switch (mode) {
      case 'all': {
        return [
          ...filterMembers(participants, query, GROUPED_LIMIT),
          ...filterProjects(projects, query, GROUPED_LIMIT),
          ...filterTasks(tasks, query, GROUPED_LIMIT),
          ...filterIssues(issues, query, GROUPED_LIMIT),
        ];
      }
      case 'project': {
        return filterProjects(projects, query, SINGLE_KIND_LIMIT);
      }
      case 'task': {
        return filterTasks(tasks, query, SINGLE_KIND_LIMIT);
      }
      case 'issue': {
        return filterIssues(issues, query, SINGLE_KIND_LIMIT);
      }
      default: {
        return [];
      }
    }
  }, [open, mode, query, participants, projects, tasks, issues]);

  const onValueChange = useCallback((newValue: string, cursorPos: number) => {
    const trigger = findTrigger(newValue, cursorPos);
    if (trigger?.triggerStart !== dismissedTrigger.current) {
      dismissedTrigger.current = null;
    }
    if (trigger && dismissedTrigger.current === null) {
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
    dismissedTrigger.current = triggerStart;
    setOpen(false);
  }, [triggerStart]);

  const selectItem = useCallback(
    (index?: number) => {
      const idx = index ?? activeIndex;
      const item = items[idx];
      if (!item) return;

      // Build the token to insert
      let token: string;
      switch (item.kind) {
        case 'member': {
          token = buildMentionToken(item.name, item.employeeId);
          break;
        }
        case 'project': {
          token = buildEntityToken(item.name, ChatEntityType.project, item.id);
          break;
        }
        case 'task': {
          token = buildEntityToken(item.title, ChatEntityType.task, item.id);
          break;
        }
        case 'issue': {
          token = buildEntityToken(item.title, ChatEntityType.issue, item.id);
          break;
        }
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
