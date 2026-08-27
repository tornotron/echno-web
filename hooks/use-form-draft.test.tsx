import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFormDraft } from './use-form-draft';
import {
  clearAllFormDrafts,
  clearFormDraft,
  formDraftKey,
  readFormDraft,
  serialiseDraftValues,
  writeFormDraft,
} from '@/lib/forms/form-draft-storage';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';

/**
 * Short enough to wait out with real timers, long enough that a write cannot
 * slip through before the "nothing is written yet" assertions.
 */
const DEBOUNCE_MS = 40;

const SCOPE = { userId: 'user-1', organizationId: 7 };
const OTHER_USER = { userId: 'user-2', organizationId: 7 };

interface Fields {
  projectName: string;
  wage?: string;
  attachments?: File[];
}

const EMPTY: Fields = { projectName: '' };

const REAL_STORAGE = globalThis.localStorage;

function useStore(store: unknown) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: store,
    configurable: true,
    writable: true,
  });
}

/** A store that refuses every write, as one at its quota does. */
function fullStore(): Storage {
  return {
    length: 0,
    key: () => null,
    getItem: () => null,
    setItem: () => {
      const error = new Error('quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    },
    removeItem: () => {},
    clear: () => {},
  } as unknown as Storage;
}

/** Renders the hook over a changeable set of values. */
function renderDraft(
  initial: Fields,
  options: {
    scope?: { userId?: string; organizationId?: number };
    recordId?: number;
    contextId?: number;
    onRestore?: (values: Fields) => void;
  } = {}
) {
  const onRestore = options.onRestore ?? mock(() => {});
  const view = renderHook(
    ({ values }: { values: Fields }) =>
      useFormDraft<Fields>({
        formId: FORM_DRAFT_IDS.PROJECT,
        scope: options.scope ?? SCOPE,
        recordId: options.recordId,
        contextId: options.contextId,
        values,
        onRestore,
        debounceMs: DEBOUNCE_MS,
      }),
    { initialProps: { values: initial } }
  );

  return { ...view, onRestore };
}

/** Waits past the debounce without asserting anything. */
function afterTheDebounce() {
  return new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS * 4));
}

beforeEach(() => {
  useStore(REAL_STORAGE);
  globalThis.localStorage.clear();
});

afterEach(() => {
  useStore(REAL_STORAGE);
  globalThis.localStorage.clear();
});

describe('useFormDraft', () => {
  test('writes once the typing pauses, not on every change', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    const { rerender } = renderDraft(EMPTY);

    rerender({ values: { projectName: 'S' } });
    rerender({ values: { projectName: 'Su' } });
    rerender({ values: { projectName: 'Sun' } });

    // Nothing has settled yet, so nothing has been written.
    expect(readFormDraft(key)).toBeNull();

    await waitFor(() => expect(readFormDraft(key)).not.toBeNull());
    expect(readFormDraft<Fields>(key)?.values.projectName).toBe('Sun');
  });

  test('a form that was only opened leaves no draft behind', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    renderDraft({ projectName: 'Existing project' });

    await afterTheDebounce();

    expect(readFormDraft(key)).toBeNull();
  });

  test('offers a stored draft rather than applying it', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    writeFormDraft(key, serialiseDraftValues({ projectName: 'Sunrise' }));

    const { result, onRestore } = renderDraft(EMPTY);

    await waitFor(() => expect(result.current.draft).not.toBeNull());
    // The fields are untouched until the user says so.
    expect(onRestore).not.toHaveBeenCalled();

    act(() => result.current.restoreDraft());

    expect(onRestore).toHaveBeenCalledWith({ projectName: 'Sunrise' });
    expect(result.current.draft).toBeNull();
  });

  test('discarding removes the draft and takes the offer down', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    writeFormDraft(key, serialiseDraftValues({ projectName: 'Sunrise' }));

    const { result, onRestore } = renderDraft(EMPTY);
    await waitFor(() => expect(result.current.draft).not.toBeNull());

    act(() => result.current.discardDraft());

    expect(result.current.draft).toBeNull();
    expect(readFormDraft(key)).toBeNull();
    expect(onRestore).not.toHaveBeenCalled();
  });

  test('a saved record clears the draft, and no queued write puts it back', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    const { rerender } = renderDraft(EMPTY);

    rerender({ values: { projectName: 'Sunrise' } });
    // The page's submit succeeded while the write was still waiting out the
    // debounce, which is the window this has to survive.
    act(() => clearFormDraft(key));

    await afterTheDebounce();

    expect(readFormDraft(key)).toBeNull();
  });

  test('the sign-out sweep leaves nothing for a queued write to restore', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    const { rerender } = renderDraft(EMPTY);

    rerender({ values: { wage: '52000', projectName: 'Sunrise' } });
    act(() => clearAllFormDrafts());

    await afterTheDebounce();

    expect(readFormDraft(key)).toBeNull();
    expect(globalThis.localStorage.length).toBe(0);
  });

  test('editing back to where it started removes the draft', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    const { rerender } = renderDraft(EMPTY);

    rerender({ values: { projectName: 'Sunrise' } });
    await waitFor(() => expect(readFormDraft(key)).not.toBeNull());

    rerender({ values: { projectName: '' } });

    await waitFor(() => expect(readFormDraft(key)).toBeNull());
  });

  test('one user"s input never reaches another user"s form', async () => {
    const mineKey = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    const theirsKey = formDraftKey(FORM_DRAFT_IDS.PROJECT, OTHER_USER);

    const mine = renderDraft(EMPTY);
    mine.rerender({ values: { wage: '52000', projectName: 'Sunrise' } });
    await waitFor(() => expect(readFormDraft(mineKey)).not.toBeNull());
    mine.unmount();

    // The next person on the same machine opens the same form.
    const theirs = renderDraft(EMPTY, { scope: OTHER_USER });

    await afterTheDebounce();
    expect(theirs.result.current.draft).toBeNull();
    expect(readFormDraft(theirsKey)).toBeNull();
  });

  test('an edit of one record is not offered on another', async () => {
    const first = renderDraft(EMPTY, { recordId: 1 });
    first.rerender({ values: { projectName: 'Sunrise' } });
    await waitFor(() =>
      expect(
        readFormDraft(formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE, 1))
      ).not.toBeNull()
    );
    first.unmount();

    const second = renderDraft(EMPTY, { recordId: 2 });

    await afterTheDebounce();
    expect(second.result.current.draft).toBeNull();
  });

  test('a draft of a new record is not offered when editing one', async () => {
    const create = renderDraft(EMPTY);
    create.rerender({ values: { projectName: 'Sunrise' } });
    await waitFor(() =>
      expect(
        readFormDraft(formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE))
      ).not.toBeNull()
    );
    create.unmount();

    const edit = renderDraft(EMPTY, { recordId: 1 });

    await afterTheDebounce();
    expect(edit.result.current.draft).toBeNull();
  });

  test('a draft under one project is not offered under another', async () => {
    const first = renderDraft(EMPTY, { contextId: 1 });
    first.rerender({ values: { projectName: 'Sunrise' } });
    await waitFor(() =>
      expect(
        readFormDraft(formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE, undefined, 1))
      ).not.toBeNull()
    );
    first.unmount();

    const second = renderDraft(EMPTY, { contextId: 2 });

    await afterTheDebounce();
    expect(second.result.current.draft).toBeNull();
  });

  test('nothing is stored while the session has no organization', async () => {
    const { rerender } = renderDraft(EMPTY, {
      scope: { userId: 'user-1' },
    });

    rerender({ values: { projectName: 'Sunrise' } });
    await afterTheDebounce();

    expect(globalThis.localStorage.length).toBe(0);
  });

  test('attachments are left out of what is stored', async () => {
    const key = formDraftKey(FORM_DRAFT_IDS.PROJECT, SCOPE);
    const { rerender } = renderDraft(EMPTY);

    rerender({
      values: {
        projectName: 'Sunrise',
        attachments: [new File(['x'], 'wage-sheet.pdf')],
      },
    });

    await waitFor(() => expect(readFormDraft(key)).not.toBeNull());
    expect(readFormDraft<Fields>(key)?.values).toEqual({
      projectName: 'Sunrise',
      attachments: [],
    });
  });

  test('a store at its quota costs the draft, not the form', async () => {
    useStore(fullStore());
    const { result, rerender } = renderDraft(EMPTY);

    expect(() =>
      rerender({ values: { projectName: 'Sunrise' } })
    ).not.toThrow();

    await afterTheDebounce();

    expect(result.current.draft).toBeNull();
  });
});
