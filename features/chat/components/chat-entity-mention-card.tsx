'use client';

import Link from 'next/link';
import { CheckSquare, AlertCircle, Folder } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { ChatEntityType, getChatEntityTypeLabel } from '@/types/chat';

interface ChatEntityMentionCardProps {
  label: string;
  entityType: ChatEntityType;
  entityId: number;
}

const ENTITY_HREF: Record<ChatEntityType, (id: number) => string> = {
  [ChatEntityType.task]: (id) =>
    `/users/dashboard/portfolio/projects/all-projects/${id}/tasks`,
  [ChatEntityType.issue]: (id) =>
    `/users/dashboard/portfolio/projects/all-projects/${id}/issues`,
  [ChatEntityType.project]: (id) =>
    `/users/dashboard/portfolio/projects/all-projects/${id}`,
};

const ENTITY_ICON: Record<ChatEntityType, React.ElementType> = {
  [ChatEntityType.task]: CheckSquare,
  [ChatEntityType.issue]: AlertCircle,
  [ChatEntityType.project]: Folder,
};

const ENTITY_COLOR: Record<ChatEntityType, string> = {
  [ChatEntityType.task]:
    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  [ChatEntityType.issue]:
    'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  [ChatEntityType.project]:
    'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
};

export function ChatEntityMentionCard({
  label,
  entityType,
  entityId,
}: ChatEntityMentionCardProps) {
  const Icon = ENTITY_ICON[entityType];
  const href = ENTITY_HREF[entityType](entityId);
  const colorClass = ENTITY_COLOR[entityType];
  const typeLabel = getChatEntityTypeLabel(entityType);

  return (
    <Link href={href} className="inline-flex">
      <Badge
        variant="outline"
        className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${colorClass}`}
      >
        <Icon className="h-3 w-3 shrink-0" />
        <span className="max-w-[180px] truncate">{label}</span>
        <span className="text-[10px] opacity-60">· {typeLabel}</span>
      </Badge>
    </Link>
  );
}
