'use client';

import { useEffect, useRef } from 'react';
import { Users, CheckSquare, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MentionItem, MentionMode } from '@/hooks/chat/use-mention';

interface ChatMentionPopupProps {
  open: boolean;
  mode: MentionMode;
  items: MentionItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  query: string;
}

const MODE_CONFIG: Record<
  MentionMode,
  { icon: React.ElementType; label: string; color: string }
> = {
  member: { icon: Users, label: 'Members', color: 'text-blue-500' },
  task: { icon: CheckSquare, label: 'Tasks', color: 'text-emerald-500' },
  issue: { icon: AlertCircle, label: 'Issues', color: 'text-red-500' },
};

function MemberRow({
  item,
  isActive,
}: {
  item: MentionItem & { kind: 'member' };
  isActive: boolean;
}) {
  const initials = item.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        {item.avatar && <AvatarImage src={item.avatar} alt={item.name} />}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span className={`truncate text-sm ${isActive ? 'font-medium' : ''}`}>
        {item.name}
      </span>
    </div>
  );
}

function TaskRow({
  item,
  isActive,
}: {
  item: MentionItem & { kind: 'task' };
  isActive: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckSquare className="h-4 w-4 shrink-0 text-emerald-500" />
      <span className={`truncate text-sm ${isActive ? 'font-medium' : ''}`}>
        {item.title}
      </span>
      <Badge variant="outline" className="ml-auto px-1.5 py-0 text-[10px]">
        #{item.id}
      </Badge>
    </div>
  );
}

function IssueRow({
  item,
  isActive,
}: {
  item: MentionItem & { kind: 'issue' };
  isActive: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
      <span className={`truncate text-sm ${isActive ? 'font-medium' : ''}`}>
        {item.title}
      </span>
      <Badge variant="outline" className="ml-auto px-1.5 py-0 text-[10px]">
        #{item.id}
      </Badge>
    </div>
  );
}

export function ChatMentionPopup({
  open,
  mode,
  items,
  activeIndex,
  onSelect,
  query,
}: ChatMentionPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <div className="bg-popover absolute right-0 bottom-full left-0 z-50 mb-1 max-h-56 overflow-hidden rounded-lg border shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b px-3 py-2">
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        <span className="text-muted-foreground text-xs font-medium">
          {config.label}
        </span>
        {query && (
          <span className="text-muted-foreground/60 ml-1 text-xs">
            &mdash; &ldquo;{query}&rdquo;
          </span>
        )}
      </div>

      {/* Items */}
      <div ref={listRef} className="max-h-48 overflow-y-auto py-1">
        {items.length === 0 ? (
          <div className="text-muted-foreground px-3 py-4 text-center text-xs">
            No {config.label.toLowerCase()} found
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={
                item.kind === 'member'
                  ? `m-${item.employeeId}`
                  : `${item.kind}-${item.id}`
              }
              data-active={idx === activeIndex}
              className={`cursor-pointer px-3 py-1.5 transition-colors ${
                idx === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // keep textarea focus
                onSelect(idx);
              }}
              onMouseEnter={() => {
                // handled via parent state — optional hover highlight
              }}
            >
              {item.kind === 'member' && (
                <MemberRow item={item} isActive={idx === activeIndex} />
              )}
              {item.kind === 'task' && (
                <TaskRow item={item} isActive={idx === activeIndex} />
              )}
              {item.kind === 'issue' && (
                <IssueRow item={item} isActive={idx === activeIndex} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="text-muted-foreground/60 border-t px-3 py-1.5 text-[10px]">
        <kbd className="bg-muted rounded border px-1 font-mono">↑↓</kbd>{' '}
        navigate ·{' '}
        <kbd className="bg-muted rounded border px-1 font-mono">Enter</kbd>{' '}
        select ·{' '}
        <kbd className="bg-muted rounded border px-1 font-mono">Esc</kbd>{' '}
        dismiss
      </div>
    </div>
  );
}
