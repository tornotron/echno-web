import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const push = mock((_href: string) => {});
mock.module('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Each collection hook records that it ran. The palette used to call all three from the
// application shell, so they ran on every route to feed a dialog that was almost never open.
const calls = { projects: 0, tasks: 0, issues: 0 };

mock.module('@tornotron/echno-core/project/hooks', () => ({
  useProjects: () => {
    calls.projects++;
    return { data: [{ id: 1, projectName: 'Riverside Tower' }] };
  },
}));

mock.module('@tornotron/echno-core/task/hooks', () => ({
  useTasks: () => {
    calls.tasks++;
    return { data: [{ id: 8, projectId: 1, title: 'Pour the raft slab' }] };
  },
}));

mock.module('@tornotron/echno-core/issue/hooks', () => ({
  useIssues: () => {
    calls.issues++;
    return { data: [{ id: 4, title: 'Crack in the beam' }] };
  },
}));

const { CommandPalette } = await import('./command-palette');

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return render(createElement(CommandPalette), { wrapper });
}

function pressAltSpace() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'Space',
        altKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

beforeEach(() => {
  calls.projects = 0;
  calls.tasks = 0;
  calls.issues = 0;
  push.mockReset();
});

describe('CommandPalette — a closed palette costs nothing', () => {
  test('renders on a route without reading any collection', () => {
    setup();

    expect(calls).toEqual({ projects: 0, tasks: 0, issues: 0 });
  });

  test('stays silent across re-renders, the way it sits in the shell', () => {
    const { rerender } = setup();

    rerender(createElement(CommandPalette));
    rerender(createElement(CommandPalette));

    expect(calls).toEqual({ projects: 0, tasks: 0, issues: 0 });
  });
});

describe('CommandPalette — opening it is what fetches', () => {
  test('reads the collections once the dialog opens', async () => {
    setup();

    pressAltSpace();

    await waitFor(() => expect(calls.projects).toBeGreaterThan(0));
    expect(calls.tasks).toBeGreaterThan(0);
    expect(calls.issues).toBeGreaterThan(0);
  });

  test('shows the rows it fetched', async () => {
    const { findByText } = setup();

    pressAltSpace();

    expect(await findByText('Riverside Tower')).toBeTruthy();
    expect(await findByText('Pour the raft slab')).toBeTruthy();
    expect(await findByText('Crack in the beam')).toBeTruthy();
  });
});
