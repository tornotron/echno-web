'use client';

import Link from 'next/link';
import { routes } from '@/nav';
import { useQuery } from '@tanstack/react-query';
import { issueKeys } from '@tornotron/echno-core/issue/hooks/keys';
import { issueService } from '@tornotron/echno-core/issue/services';
import { taskKeys } from '@tornotron/echno-core/task/hooks/keys';
import { taskService } from '@tornotron/echno-core/task/services';
import { CheckSquare, AlertCircle, Folder } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { ChatEntityType, getChatEntityTypeLabel } from '@/types/chat';

interface ChatEntityMentionCardProps {
  label: string;
  entityType: ChatEntityType;
  entityId: number;
}

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

const STALE_TIME = 5 * 60 * 1000;

/**
 * The message token holds only the entity's own id, and a task or issue page
 * sits under its project, so the project is read from the record. An issue
 * reaches its project through its task. Until that is known, or for an issue
 * with no task, the link goes to the list of all tasks or issues.
 */
function useEntityHref(entityType: ChatEntityType, entityId: number): string {
  const isTask = entityType === ChatEntityType.task;
  const isIssue = entityType === ChatEntityType.issue;
  // Through the service: core's useIssue also reads the full employee list,
  // which the backend refuses to most members.
  const { data: issue } = useQuery({
    queryKey: issueKeys.detail(entityId),
    queryFn: () => issueService.getById(entityId),
    enabled: isIssue,
    staleTime: STALE_TIME,
    retry: false,
  });
  const taskId = isTask ? entityId : issue?.taskId;
  const { data: task } = useQuery({
    queryKey: taskKeys.detail(taskId ?? 0),
    queryFn: () => taskService.getById(taskId as number),
    enabled: Boolean(taskId),
    staleTime: STALE_TIME,
    retry: false,
  });
  const project = routes.projects.allProjects.detail;

  if (isTask) {
    return task
      ? project(task.projectId).tasks.detail(entityId).href
      : routes.projects.allTasks;
  }
  if (isIssue) {
    return task
      ? project(task.projectId).issues.detail(entityId).href
      : routes.projects.allIssues;
  }
  return project(entityId).href;
}

export function ChatEntityMentionCard({
  label,
  entityType,
  entityId,
}: ChatEntityMentionCardProps) {
  const Icon = ENTITY_ICON[entityType];
  const href = useEntityHref(entityType, entityId);
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
