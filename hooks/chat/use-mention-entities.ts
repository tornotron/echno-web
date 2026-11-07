// hooks/chat/use-mention-entities.ts
//
// The projects, tasks and issues a chat room's @ list can offer. A room linked
// to a project offers that project's tasks and issues; any other room offers
// the organization's. Nothing loads until `enabled` is set, which the room does
// when the list first opens.
//
// These read through the services, with core's query keys, for two reasons:
// core's hooks have no way to wait, and its issue hooks also read the full
// employee list, which the backend refuses to most members. Chat is mounted on
// every page, so it must not make that call.

import { useQuery } from '@tanstack/react-query';
import { issueKeys } from '@tornotron/echno-core/issue/hooks/keys';
import { issueService } from '@tornotron/echno-core/issue/services';
import { projectKeys } from '@tornotron/echno-core/project/hooks/keys';
import { projectService } from '@tornotron/echno-core/project/services';
import { taskKeys } from '@tornotron/echno-core/task/hooks/keys';
import { taskService } from '@tornotron/echno-core/task/services';

const STALE_TIME = 5 * 60 * 1000;

export function useMentionEntities(
  projectId: number | undefined,
  enabled: boolean
) {
  const { data: tasks = [] } = useQuery({
    queryKey: projectId ? taskKeys.byProject(projectId) : taskKeys.lists(),
    queryFn: () =>
      projectId ? taskService.getByProjectId(projectId) : taskService.getAll(),
    enabled,
    staleTime: STALE_TIME,
  });
  const { data: issues = [] } = useQuery({
    queryKey: projectId ? issueKeys.byProject(projectId) : issueKeys.lists(),
    queryFn: () =>
      projectId
        ? issueService.getByProjectId(projectId)
        : issueService.getAll(),
    enabled,
    staleTime: STALE_TIME,
  });
  const { data: projects = [] } = useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => projectService.getAll(),
    enabled,
    staleTime: STALE_TIME,
  });

  return { projects, tasks, issues };
}
