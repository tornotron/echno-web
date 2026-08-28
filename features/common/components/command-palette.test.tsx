import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const push = mock((_href: string) => {});
mock.module('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

type Hit = {
  type: 'PROJECT' | 'TASK' | 'ISSUE';
  id: number;
  title: string;
  projectId: number | null;
};

/**
 * Stands in for the search endpoint. Records every term the palette asks for, which is how the
 * "a closed palette asks for nothing" cases are asserted, and answers from `hits`.
 */
const searchState: { terms: string[]; hits: Hit[] } = { terms: [], hits: [] };

mock.module('@tornotron/echno-core/search/hooks', () => ({
  useSearch: (term: string) => {
    searchState.terms.push(term);
    return {
      data: term.trim().length >= 2 ? searchState.hits : [],
      isFetching: false,
    };
  },
}));

mock.module('@tornotron/echno-core/search/services', () => ({
  SEARCH_MIN_TERM_LENGTH: 2,
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

/** The terms the palette actually sent to the server, ignoring the empty ones. */
function searchedTerms() {
  return searchState.terms.filter((term) => term.trim().length > 0);
}

// Each test renders another palette into the same document, and the suite shares one DOM across
// files, so an uncleaned render leaves a second search box behind for the next query to trip over.
afterEach(cleanup);

beforeEach(() => {
  searchState.terms = [];
  searchState.hits = [];
  push.mockReset();
});

describe('CommandPalette: a closed palette costs nothing', () => {
  test('renders on a route without searching for anything', () => {
    setup();

    expect(searchState.terms).toEqual([]);
  });

  test('stays silent across re-renders, the way it sits in the shell', () => {
    const { rerender } = setup();

    rerender(createElement(CommandPalette));
    rerender(createElement(CommandPalette));

    expect(searchState.terms).toEqual([]);
  });
});

describe('CommandPalette: an open palette with nothing typed', () => {
  test('asks for no term until the user types one', async () => {
    const { findByPlaceholderText } = setup();

    pressAltSpace();
    await findByPlaceholderText(/search pages/i);

    expect(searchedTerms()).toEqual([]);
  });

  test('still offers the static pages, which need no request', async () => {
    const { findAllByText } = setup();

    pressAltSpace();

    // "Pages" is both the group heading and one of the nav labels under it.
    const pageLabels = await findAllByText('Pages');
    expect(pageLabels.length).toBeGreaterThan(0);
    expect(searchedTerms()).toEqual([]);
  });
});

describe('CommandPalette: searching', () => {
  test('sends the typed term to the server once it settles', async () => {
    const { findByPlaceholderText } = setup();
    pressAltSpace();
    const input = await findByPlaceholderText(/search pages/i);

    fireEvent.change(input, { target: { value: 'zeta' } });

    await waitFor(() => expect(searchedTerms()).toContain('zeta'));
  });

  /**
   * The regression this endpoint exists for.
   *
   * The shell used to hand the palette `projects.slice(0, 30)`, and that slice ran *before* the
   * palette searched, so a project past the thirtieth could not be found by name even when its row
   * had been downloaded. Thirty-five hits come back here and the last one has to be on screen: if
   * a cap were reintroduced anywhere between the query and the list, this is what would catch it.
   */
  test('finds a project well past the thirtieth match', async () => {
    searchState.hits = Array.from({ length: 35 }, (_, index) => ({
      type: 'PROJECT' as const,
      id: index + 1,
      title: `Zeta Tower ${index + 1}`,
      projectId: index + 1,
    }));

    const { findByPlaceholderText, findByText } = setup();
    pressAltSpace();
    const input = await findByPlaceholderText(/search pages/i);

    fireEvent.change(input, { target: { value: 'zeta' } });

    expect(await findByText('Zeta Tower 31')).toBeTruthy();
    expect(await findByText('Zeta Tower 35')).toBeTruthy();
  });

  test('renders a hit of each kind', async () => {
    searchState.hits = [
      { type: 'PROJECT', id: 1, title: 'Riverside Tower', projectId: 1 },
      { type: 'TASK', id: 8, title: 'Pour the raft slab', projectId: 1 },
      { type: 'ISSUE', id: 4, title: 'Crack in the beam', projectId: 1 },
    ];

    const { findByPlaceholderText, findByText } = setup();
    pressAltSpace();
    const input = await findByPlaceholderText(/search pages/i);

    fireEvent.change(input, { target: { value: 'tower' } });

    expect(await findByText('Riverside Tower')).toBeTruthy();
    expect(await findByText('Pour the raft slab')).toBeTruthy();
    expect(await findByText('Crack in the beam')).toBeTruthy();
  });

  test('drops a task that has no project rather than offering a dead link', async () => {
    searchState.hits = [
      { type: 'TASK', id: 8, title: 'Orphan task', projectId: null },
      { type: 'TASK', id: 9, title: 'Housed task', projectId: 1 },
    ];

    const { findByPlaceholderText, findByText, queryByText } = setup();
    pressAltSpace();
    const input = await findByPlaceholderText(/search pages/i);

    fireEvent.change(input, { target: { value: 'task' } });

    expect(await findByText('Housed task')).toBeTruthy();
    expect(queryByText('Orphan task')).toBeNull();
  });

  test('navigates to the project a selected task belongs to', async () => {
    searchState.hits = [
      { type: 'TASK', id: 8, title: 'Pour the raft slab', projectId: 42 },
    ];

    const { findByPlaceholderText, findByText } = setup();
    pressAltSpace();
    const input = await findByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'slab' } });

    const row = await findByText('Pour the raft slab');
    fireEvent.click(row);

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push.mock.calls[0]?.[0]).toContain('/42/');
    expect(push.mock.calls[0]?.[0]).toContain('/8');
  });
});
