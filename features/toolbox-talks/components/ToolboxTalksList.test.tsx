/**
 * The list renders through the core hooks: `useToolboxTalksList` is
 * mocked at the `@tornotron/echno-core/toolbox-talks/hooks` subpath, the way
 * the app imports it, and the rows it returns are what the table shows.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';

let listState: {
  data:
    | {
        content: { id: string; name: string; description: string }[];
        page: number;
        totalPages: number;
      }
    | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
} = { data: undefined, isLoading: true, isError: false, error: null };

mock.module('@tornotron/echno-core/toolbox-talks/hooks', () => ({
  useToolboxTalksList: () => listState,
  useCreateToolboxTalks: () => ({
    mutate: () => {},
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const { ToolboxTalksList } = await import('./ToolboxTalksList');

afterEach(() => {
  cleanup();
  listState = { data: undefined, isLoading: true, isError: false, error: null };
});

describe('ToolboxTalksList', () => {
  test('shows the loading state before the hook settles', () => {
    const { getByText } = render(<ToolboxTalksList />);
    expect(getByText('Loading')).toBeInTheDocument();
  });

  test('renders the rows the hook returns', () => {
    listState = {
      data: {
        content: [
          { id: '1', name: 'First record', description: 'From the hook' },
        ],
        page: 0,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    };
    const { getByText } = render(<ToolboxTalksList />);
    expect(getByText('First record')).toBeInTheDocument();
    expect(getByText('From the hook')).toBeInTheDocument();
    expect(getByText('Page 1 of 1')).toBeInTheDocument();
  });

  test('an empty page says so instead of rendering nothing', () => {
    listState = {
      data: { content: [], page: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    };
    const { getByText } = render(<ToolboxTalksList />);
    expect(getByText('Nothing recorded yet.')).toBeInTheDocument();
  });
});
