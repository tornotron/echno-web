/**
 * Typing @ offered only people. It now offers people, projects, tasks and
 * issues, grouped, and a picked task or issue links to its own page under its
 * project, where the link used to read the task's id as a project's id.
 */
import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Issue } from '@tornotron/echno-core/issue/types';
import type { Project } from '@tornotron/echno-core/project/types';
import type { Task } from '@tornotron/echno-core/task/types';
import { issueService } from '@tornotron/echno-core/issue/services';
import { projectService } from '@tornotron/echno-core/project/services';
import { taskService } from '@tornotron/echno-core/task/services';
import { useMentionEntities } from '@/hooks/chat/use-mention-entities';
import { ChatEntityType, type ChatParticipant } from '@/types/chat';
import { ChatComposer } from './chat-composer';
import { ChatEntityMentionCard } from './chat-entity-mention-card';

const participants = [
  { employeeId: 12, employee: { name: 'Asha Menon' } },
] as unknown as ChatParticipant[];
const projects = [{ id: 3, projectName: 'Riverside Tower' }] as Project[];
const tasks = [{ id: 5, title: 'Pour slab' }] as Task[];
const issues = [{ id: 9, title: 'Crack in slab' }] as Issue[];

function composer() {
  const utils = render(
    <ChatComposer
      onSend={() => {}}
      participants={participants}
      projects={projects}
      tasks={tasks}
      issues={issues}
    />
  );
  const box = utils.container.querySelector('textarea') as HTMLTextAreaElement;
  const type = (text: string) =>
    fireEvent.change(box, {
      target: { value: text, selectionStart: text.length },
    });
  return { ...utils, box, type };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const spies: { mockRestore: () => void }[] = [];
function spy<T extends { mockRestore: () => void }>(s: T): T {
  spies.push(s);
  return s;
}

afterEach(() => {
  cleanup();
  for (const s of spies.splice(0)) s.mockRestore();
});

describe('the @ list', () => {
  test('offers people, projects, tasks and issues under their own headings', () => {
    const { type, getByText } = composer();
    type('@');
    for (const text of [
      'Members',
      'Asha Menon',
      'Projects',
      'Riverside Tower',
      'Tasks',
      'Pour slab',
      'Issues',
      'Crack in slab',
    ]) {
      expect(getByText(text)).toBeInTheDocument();
    }
  });

  test('searches across all of them', () => {
    const { type, getByText, queryByText } = composer();
    type('@slab');
    expect(getByText('Pour slab')).toBeInTheDocument();
    expect(getByText('Crack in slab')).toBeInTheDocument();
    expect(queryByText('Riverside Tower')).toBeNull();
    expect(queryByText('Members')).toBeNull();
  });

  test('picking a project inserts a project token', () => {
    const { type, getByText, box } = composer();
    type('@River');
    fireEvent.mouseDown(getByText('Riverside Tower'));
    expect(box.value).toBe('#[Riverside Tower](project:3) ');
  });

  test('the @Task shortcut still narrows to tasks', () => {
    const { type, getByText, queryByText } = composer();
    type('@Task ');
    expect(getByText('Pour slab')).toBeInTheDocument();
    expect(queryByText('Crack in slab')).toBeNull();
  });
});

describe('a mention link', () => {
  function href(entityType: ChatEntityType, entityId: number) {
    const { getByRole } = render(
      <ChatEntityMentionCard
        label="x"
        entityType={entityType}
        entityId={entityId}
      />,
      { wrapper }
    );
    return () => getByRole('link').getAttribute('href');
  }

  test('a task opens the task under its project', async () => {
    spy(spyOn(taskService, 'getById')).mockResolvedValue({
      projectId: 3,
    } as Task);
    const link = href(ChatEntityType.task, 5);
    expect(link()).toEndWith('/projects/all-tasks');
    await waitFor(() =>
      expect(link()).toEndWith('/projects/all-projects/3/tasks/5')
    );
  });

  test('an issue opens the issue under its task project', async () => {
    spy(spyOn(issueService, 'getById')).mockResolvedValue({
      taskId: 5,
    } as Issue);
    spy(spyOn(taskService, 'getById')).mockResolvedValue({
      projectId: 3,
    } as Task);
    const link = href(ChatEntityType.issue, 9);
    await waitFor(() =>
      expect(link()).toEndWith('/projects/all-projects/3/issues/9')
    );
  });

  test('an issue with no task opens the list of all issues', async () => {
    const getIssue = spy(spyOn(issueService, 'getById')).mockResolvedValue(
      {} as Issue
    );
    const link = href(ChatEntityType.issue, 9);
    await waitFor(() => expect(getIssue).toHaveBeenCalled());
    expect(link()).toEndWith('/projects/all-issues');
  });

  test('a project opens the project', () => {
    expect(href(ChatEntityType.project, 3)()).toEndWith(
      '/projects/all-projects/3'
    );
  });
});

describe('useMentionEntities', () => {
  test('loads nothing until the list has opened, then the organization lists', async () => {
    const getTasks = spy(spyOn(taskService, 'getAll')).mockResolvedValue(tasks);
    const getIssues = spy(spyOn(issueService, 'getAll')).mockResolvedValue(
      issues
    );
    const getProjects = spy(spyOn(projectService, 'getAll')).mockResolvedValue(
      projects
    );

    const { result, rerender } = renderHook(
      ({ enabled }) => useMentionEntities(undefined, enabled),
      { wrapper, initialProps: { enabled: false } }
    );
    expect(getTasks).not.toHaveBeenCalled();
    expect(getIssues).not.toHaveBeenCalled();
    expect(getProjects).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.tasks).toEqual(tasks));
    await waitFor(() => expect(result.current.issues).toEqual(issues));
    await waitFor(() => expect(result.current.projects).toEqual(projects));
  });

  test("a project's room reads that project's tasks and issues", async () => {
    const getTasks = spy(
      spyOn(taskService, 'getByProjectId')
    ).mockResolvedValue(tasks);
    const getIssues = spy(
      spyOn(issueService, 'getByProjectId')
    ).mockResolvedValue(issues);
    spy(spyOn(projectService, 'getAll')).mockResolvedValue(projects);

    const { result } = renderHook(() => useMentionEntities(3, true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.tasks).toEqual(tasks));
    await waitFor(() => expect(result.current.issues).toEqual(issues));
    expect(getTasks).toHaveBeenCalledWith(3);
    expect(getIssues).toHaveBeenCalledWith(3);
  });
});
