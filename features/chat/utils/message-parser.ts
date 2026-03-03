// features/chat/utils/message-parser.ts
//
// Parses chat message content into typed segments for rendering.
//
// Syntax:
//   @[Name](123)              → employee mention
//   #[Label](task:42)         → entity mention (task/issue/project)
//   everything else           → plain text

import { ChatEntityType, chatEntityTypeFromString } from '@/types/chat';

export type MessageSegment =
  | { type: 'text'; text: string }
  | { type: 'mention'; name: string; employeeId: number }
  | {
      type: 'entity';
      label: string;
      entityType: ChatEntityType;
      entityId: number;
    };

// Regex: matches @[Name](id) or #[Label](type:id)
const MENTION_REGEX = /@\[([^\]]+)\]\((\d+)\)/g;
const ENTITY_REGEX = /#\[([^\]]+)\]\((\w+):(\d+)\)/g;
const TOKEN_REGEX = /(@\[[^\]]+\]\(\d+\)|#\[[^\]]+\]\(\w+:\d+\))/g;

/**
 * Parse a raw message content string into typed segments.
 *
 * @example
 * parseMentions('Hello @[Alice](1) see #[Task A](task:5)')
 * // → [
 * //   { type: 'text', text: 'Hello ' },
 * //   { type: 'mention', name: 'Alice', employeeId: 1 },
 * //   { type: 'text', text: ' see ' },
 * //   { type: 'entity', label: 'Task A', entityType: 'task', entityId: 5 },
 * // ]
 */
export function parseMentions(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const parts = content.split(TOKEN_REGEX);

  for (const part of parts) {
    if (!part) continue;

    // Try @mention
    const mentionMatch = part.match(/^@\[([^\]]+)\]\((\d+)\)$/);
    if (mentionMatch) {
      segments.push({
        type: 'mention',
        name: mentionMatch[1],
        employeeId: Number.parseInt(mentionMatch[2], 10),
      });
      continue;
    }

    // Try #entity
    const entityMatch = part.match(/^#\[([^\]]+)\]\((\w+):(\d+)\)$/);
    if (entityMatch) {
      segments.push({
        type: 'entity',
        label: entityMatch[1],
        entityType: chatEntityTypeFromString(entityMatch[2]),
        entityId: Number.parseInt(entityMatch[3], 10),
      });
      continue;
    }

    // Plain text
    segments.push({ type: 'text', text: part });
  }

  return segments;
}

/**
 * Extract plain text (strip mention/entity syntax).
 */
export function stripMentions(content: string): string {
  return content
    .replaceAll(MENTION_REGEX, '@$1')
    .replaceAll(ENTITY_REGEX, '#$1');
}

/**
 * Build a mention token string from a name and employee ID.
 */
export function buildMentionToken(name: string, employeeId: number): string {
  return `@[${name}](${employeeId})`;
}

const AVATAR_COLORS = [
  'bg-red-500 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
  'bg-green-600 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-600 text-white',
  'bg-blue-500 text-white',
  'bg-indigo-500 text-white',
  'bg-violet-500 text-white',
  'bg-pink-500 text-white',
];

/**
 * Returns a deterministic Tailwind color class pair (bg + text) for a given name.
 * The same name always maps to the same color.
 */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (name.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Build an entity mention token string.
 */
export function buildEntityToken(
  label: string,
  entityType: ChatEntityType,
  entityId: number
): string {
  return `#[${label}](${entityType}:${entityId})`;
}
