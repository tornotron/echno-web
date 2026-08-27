import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  clearAllFormDrafts,
  clearFormDraft,
  FORM_DRAFT_LIMITS,
  formDraftKey,
  onFormDraftCleared,
  pruneFormDrafts,
  readFormDraft,
  serialiseDraftValues,
  writeFormDraft,
} from './form-draft-storage';

const REAL_STORAGE = globalThis.localStorage;

/** Puts a stand-in store in place of the real one, for the failure cases. */
function useStore(store: unknown) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: store,
    configurable: true,
    writable: true,
  });
}

/** What every operation on a blocked store does. */
function die(): never {
  throw new Error('storage is unavailable');
}

/** A store whose every operation throws, as a blocked or private one does. */
function throwingStore(): Storage {
  return {
    get length(): number {
      return die();
    },
    key: die,
    getItem: die,
    setItem: die,
    removeItem: die,
    clear: die,
  } as unknown as Storage;
}

/** A store that accepts reads and evictions but refuses every write. */
function fullStore(): Storage {
  const backing = new Map<string, string>();
  return {
    get length() {
      return backing.size;
    },
    key: (index: number) => [...backing.keys()][index] ?? null,
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: () => {
      const error = new Error('quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    },
    removeItem: (key: string) => {
      backing.delete(key);
    },
    clear: () => backing.clear(),
  } as unknown as Storage;
}

const SCOPE = { userId: 'user-1', organizationId: 7 };

beforeEach(() => {
  useStore(REAL_STORAGE);
  globalThis.localStorage.clear();
});

afterEach(() => {
  useStore(REAL_STORAGE);
  globalThis.localStorage.clear();
});

describe('formDraftKey', () => {
  test('one user cannot see another user"s draft', () => {
    expect(formDraftKey('project', { ...SCOPE, userId: 'a' })).not.toBe(
      formDraftKey('project', { ...SCOPE, userId: 'b' })
    );
  });

  test('one organization cannot see another"s draft', () => {
    expect(formDraftKey('project', { ...SCOPE, organizationId: 1 })).not.toBe(
      formDraftKey('project', { ...SCOPE, organizationId: 2 })
    );
  });

  test('two forms do not share a draft', () => {
    expect(formDraftKey('project', SCOPE)).not.toBe(
      formDraftKey('issue', SCOPE)
    );
  });

  test('an edit of one record does not restore into another', () => {
    expect(formDraftKey('project', SCOPE, 1)).not.toBe(
      formDraftKey('project', SCOPE, 2)
    );
  });

  test('creating and editing are different drafts', () => {
    expect(formDraftKey('project', SCOPE)).not.toBe(
      formDraftKey('project', SCOPE, 1)
    );
  });

  test('a record id cannot impersonate the create marker', () => {
    expect(formDraftKey('project', SCOPE, 'new')).not.toBe(
      formDraftKey('project', SCOPE)
    );
  });

  test('a form under one parent is not offered under another', () => {
    // A new issue raised against project 1 and one against project 2 are two
    // different pieces of typing.
    expect(formDraftKey('issue', SCOPE, undefined, 1)).not.toBe(
      formDraftKey('issue', SCOPE, undefined, 2)
    );
    expect(formDraftKey('issue', SCOPE, undefined, 1)).not.toBe(
      formDraftKey('issue', SCOPE)
    );
  });

  test('a separator inside a segment cannot shift the boundaries', () => {
    // Without escaping, ('a:b', 'c') and ('a', 'b:c') join to the same string.
    expect(
      formDraftKey('project', { userId: 'a:b', organizationId: 'c' })
    ).not.toBe(formDraftKey('project', { userId: 'a', organizationId: 'b:c' }));

    // Same for the two segments that carry ids the user can influence.
    expect(formDraftKey('issue', SCOPE, 'a:b', 'c')).not.toBe(
      formDraftKey('issue', SCOPE, 'a', 'b:c')
    );
  });

  test('there is no key without a user or an organization', () => {
    expect(formDraftKey('project', { organizationId: 7 })).toBeNull();
    expect(formDraftKey('project', { userId: 'user-1' })).toBeNull();
    expect(
      formDraftKey('project', { userId: '', organizationId: 7 })
    ).toBeNull();
    expect(
      formDraftKey('project', { userId: 'u', organizationId: null })
    ).toBeNull();
  });

  test('a null key stores and reads nothing', () => {
    expect(writeFormDraft(null, '{"a":1}')).toBe(false);
    expect(readFormDraft(null)).toBeNull();
  });
});

describe('serialiseDraftValues', () => {
  test('files are never persisted, wherever they sit', () => {
    const file = new File(['x'], 'wage-sheet.pdf');
    const serialised = serialiseDraftValues({
      projectName: 'Sunrise',
      cover: file,
      attachments: [file, file],
      nested: { plan: file, note: 'keep me' },
    });

    expect(serialised).toBe(
      JSON.stringify({
        projectName: 'Sunrise',
        attachments: [],
        nested: { note: 'keep me' },
      })
    );
  });

  test('a value that cannot be serialised at all yields null', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(serialiseDraftValues(cyclic)).toBeNull();
  });
});

describe('reading and writing', () => {
  test('a draft comes back as it was written', () => {
    const key = formDraftKey('project', SCOPE);
    writeFormDraft(key, serialiseDraftValues({ projectName: 'Sunrise' }), 1000);

    expect(readFormDraft(key, 1000)).toEqual({
      savedAt: 1000,
      values: { projectName: 'Sunrise' },
    });
  });

  test('a draft written for one user is invisible to another', () => {
    const mine = formDraftKey('project', { userId: 'a', organizationId: 1 });
    const theirs = formDraftKey('project', { userId: 'b', organizationId: 1 });

    writeFormDraft(mine, serialiseDraftValues({ wage: '52000' }), 1000);

    expect(readFormDraft(theirs, 1000)).toBeNull();
  });

  test('a draft past its age is dropped rather than offered', () => {
    const key = formDraftKey('project', SCOPE);
    writeFormDraft(key, serialiseDraftValues({ projectName: 'Sunrise' }), 1000);

    const later = 1000 + FORM_DRAFT_LIMITS.MAX_AGE_MS;
    expect(readFormDraft(key, later)).toBeNull();
    expect(globalThis.localStorage.getItem(key as string)).toBeNull();
  });

  test('a corrupt entry reads as no draft', () => {
    const key = formDraftKey('project', SCOPE) as string;
    globalThis.localStorage.setItem(key, 'not json');
    expect(readFormDraft(key)).toBeNull();
  });
});

describe('bounds', () => {
  test('the store settles at the cap, oldest evicted first', () => {
    const total = FORM_DRAFT_LIMITS.MAX_ENTRIES + 5;
    for (let index = 0; index < total; index += 1) {
      writeFormDraft(
        formDraftKey('project', SCOPE, index),
        serialiseDraftValues({ n: index }),
        1000 + index
      );
    }

    expect(globalThis.localStorage.length).toBe(FORM_DRAFT_LIMITS.MAX_ENTRIES);
    // The first written is gone; the last written is still there.
    expect(readFormDraft(formDraftKey('project', SCOPE, 0), 1000)).toBeNull();
    expect(
      readFormDraft(formDraftKey('project', SCOPE, total - 1), 1000)
    ).not.toBeNull();
  });

  test('pruning removes what has expired', () => {
    writeFormDraft(
      formDraftKey('project', SCOPE, 1),
      serialiseDraftValues({ n: 1 }),
      1000
    );
    writeFormDraft(
      formDraftKey('project', SCOPE, 2),
      serialiseDraftValues({ n: 2 }),
      2000
    );

    const removed = pruneFormDrafts(1000 + FORM_DRAFT_LIMITS.MAX_AGE_MS);
    expect(removed).toBe(1);
    expect(globalThis.localStorage.length).toBe(1);
  });
});

describe('a store that will not co-operate', () => {
  test('a full store costs a draft, not a throw', () => {
    useStore(fullStore());
    const key = formDraftKey('project', SCOPE);

    expect(() => writeFormDraft(key, '{"a":1}', 1000)).not.toThrow();
    expect(writeFormDraft(key, '{"a":1}', 1000)).toBe(false);
  });

  test('a blocked store degrades to no drafts', () => {
    useStore(throwingStore());
    const key = formDraftKey('project', SCOPE);

    expect(writeFormDraft(key, '{"a":1}', 1000)).toBe(false);
    expect(readFormDraft(key, 1000)).toBeNull();
    expect(() => clearFormDraft(key)).not.toThrow();
    expect(() => clearAllFormDrafts()).not.toThrow();
    expect(() => pruneFormDrafts(1000)).not.toThrow();
  });

  test('an absent store degrades to no drafts', () => {
    useStore(undefined);
    const key = formDraftKey('project', SCOPE);

    expect(writeFormDraft(key, '{"a":1}', 1000)).toBe(false);
    expect(readFormDraft(key, 1000)).toBeNull();
    expect(() => clearAllFormDrafts()).not.toThrow();
  });
});

describe('clearing', () => {
  test('clearing one draft leaves the others alone', () => {
    const first = formDraftKey('project', SCOPE, 1);
    const second = formDraftKey('project', SCOPE, 2);
    writeFormDraft(first, serialiseDraftValues({ n: 1 }), 1000);
    writeFormDraft(second, serialiseDraftValues({ n: 2 }), 1000);

    clearFormDraft(first);

    expect(readFormDraft(first, 1000)).toBeNull();
    expect(readFormDraft(second, 1000)).not.toBeNull();
  });

  test('sign-out sweeps every draft on the profile', () => {
    writeFormDraft(
      formDraftKey('project', { userId: 'a', organizationId: 1 }),
      serialiseDraftValues({ wage: '52000' }),
      1000
    );
    writeFormDraft(
      formDraftKey('issue', { userId: 'b', organizationId: 2 }),
      serialiseDraftValues({ vendor: 'Acme' }),
      1000
    );

    clearAllFormDrafts();

    expect(globalThis.localStorage.length).toBe(0);
  });

  test('the sweep leaves storage that is not a draft where it is', () => {
    globalThis.localStorage.setItem('echno:session-activity', 'keep me');
    writeFormDraft(
      formDraftKey('project', SCOPE),
      serialiseDraftValues({ n: 1 }),
      1000
    );

    clearAllFormDrafts();

    expect(globalThis.localStorage.getItem('echno:session-activity')).toBe(
      'keep me'
    );
  });

  test('a form watching its key is told when the draft goes', () => {
    const key = formDraftKey('project', SCOPE);
    let told = 0;
    const stop = onFormDraftCleared(key, () => {
      told += 1;
    });

    writeFormDraft(key, serialiseDraftValues({ n: 1 }), 1000);
    clearFormDraft(key);
    expect(told).toBe(1);

    writeFormDraft(key, serialiseDraftValues({ n: 1 }), 1000);
    clearAllFormDrafts();
    expect(told).toBe(2);

    stop();
    writeFormDraft(key, serialiseDraftValues({ n: 1 }), 1000);
    clearFormDraft(key);
    expect(told).toBe(2);
  });
});
