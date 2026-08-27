/**
 * Local storage for half-filled forms.
 *
 * A session can end while someone is still typing: an idle sign-out, a closed
 * tab, a browser crash, a mistaken back button. None of those are worth losing
 * twenty minutes of data entry to, so the long forms keep a copy of what has
 * been typed and offer it back on the way in.
 *
 * Everything here is deliberately free of React so the rules that matter, key
 * isolation above all, can be exercised directly. The hook in
 * `hooks/use-form-draft.ts` is the only thing that should call it from a form.
 *
 * Three properties this module is responsible for:
 *
 * - **Isolation.** A key carries the user, the organization, the form and the
 *   record. Two people on one site machine, or one person in two organizations,
 *   must never be shown each other's input, so the key is built in exactly one
 *   place and every segment is escaped before it is joined.
 * - **Boundedness.** localStorage has a hard quota shared with everything else
 *   the app keeps there, and a purchase order with thirty line items is not
 *   small. Drafts expire, the newest few are kept, and a quota error costs a
 *   draft rather than the form the user is filling in.
 * - **Safety of what is written.** Files never go in. Neither does anything
 *   else that does not survive a JSON round trip.
 */

/**
 * Namespace for every draft entry.
 *
 * Versioned, so a change to the envelope can be shipped by bumping this and
 * letting the old entries expire rather than by writing a migration for data
 * whose whole purpose is to be short-lived.
 */
const DRAFT_KEY_PREFIX = 'echno:form-draft:v1';

/** Marker for the create case, where there is no record id to key on. */
const NEW_RECORD_SEGMENT = 'new';

/** Marker for a form that hangs off nothing in particular. */
const NO_CONTEXT_SEGMENT = 'root';

/** Prefix for the edit case, so an id can never be read as the create marker. */
const RECORD_SEGMENT_PREFIX = 'id';

/** How far a draft is allowed to run before it stops being offered. */
export const FORM_DRAFT_LIMITS = {
  /**
   * Age at which a draft is dropped (24 hours).
   *
   * A draft is a recovery from an interrupted sitting, not a saved document.
   * Offering yesterday's half-finished form is how someone submits stale data
   * without noticing what they are agreeing to.
   */
  MAX_AGE_MS: 24 * 60 * 60 * 1000,

  /**
   * How many drafts are retained at once, oldest evicted first.
   *
   * Nobody is genuinely part way through twenty forms. The cap is what stops a
   * long-lived profile accumulating entries until the quota is the app's
   * problem.
   */
  MAX_ENTRIES: 20,
} as const;

/** What a stored draft holds. */
export interface StoredFormDraft<T> {
  /** Epoch milliseconds when the draft was written. */
  savedAt: number;
  /** The form values, minus anything that does not serialise. */
  values: T;
}

/** The identity a draft belongs to. */
export interface FormDraftScope {
  /** The signed-in user. */
  userId?: string | number | null;
  /** The organization they are working in. */
  organizationId?: string | number | null;
}

/** The envelope as it appears on disk. */
interface DraftEnvelope {
  savedAt: number;
  values: unknown;
}

/**
 * Values dropped during sanitising.
 *
 * A distinct sentinel rather than `undefined`, so a form field genuinely set to
 * `undefined` is told apart from one holding a file.
 */
const OMIT = Symbol('omit');

/**
 * Escapes one key segment.
 *
 * The separator is a colon, so a segment containing one would otherwise be able
 * to impersonate a segment boundary: an organization id of `1:2` and a form id
 * of `3` would build the same key as an organization id of `1` and a form id of
 * `2:3`. Percent-encoding the separator out of every segment closes that.
 */
function escapeSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

/**
 * Builds the storage key for one form's draft, or returns null if it cannot.
 *
 * Null is the important half of the signature. Without a user and an
 * organization there is no way to say whose draft this is, and an unscoped
 * draft on a shared site machine is exactly the leak this design exists to
 * prevent. Callers that get null persist nothing.
 *
 * @param formId - Stable identifier for the form, unique across the app.
 * @param scope - The signed-in user and the organization they are working in.
 * @param recordId - The record being edited, or null/undefined when creating.
 * @param contextId - What the form hangs off, for the forms that are reached
 *   through a parent: a new issue is raised against one project, and the half
 *   typed one waiting under project A has no business appearing under B. Omit
 *   it for a form that stands on its own.
 */
export function formDraftKey(
  formId: string,
  scope: FormDraftScope,
  recordId?: string | number | null,
  contextId?: string | number | null
): string | null {
  const { userId, organizationId } = scope;

  if (userId === undefined || userId === null || userId === '') return null;
  if (
    organizationId === undefined ||
    organizationId === null ||
    organizationId === ''
  ) {
    return null;
  }
  if (!formId) return null;

  // The create case and the edit case are different drafts of different things,
  // so they get different keys and one can never restore into the other.
  const record =
    recordId === undefined || recordId === null || recordId === ''
      ? NEW_RECORD_SEGMENT
      : `${RECORD_SEGMENT_PREFIX}.${escapeSegment(recordId)}`;

  const context =
    contextId === undefined || contextId === null || contextId === ''
      ? NO_CONTEXT_SEGMENT
      : escapeSegment(contextId);

  return [
    DRAFT_KEY_PREFIX,
    escapeSegment(userId),
    escapeSegment(organizationId),
    escapeSegment(formId),
    context,
    record,
  ].join(':');
}

/**
 * The store, or null where there isn't one.
 *
 * Private windows and blocked site data throw on access rather than returning
 * nothing, and a form that cannot save a draft must still work, so every path
 * in this module goes through here.
 */
function getStore(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Strips anything that will not survive a JSON round trip.
 *
 * Files are the reason this exists. Half an upload is not a draft, a `File`
 * serialises to `{}` and would come back as a broken attachment row, and the
 * bytes have no business sitting in localStorage in the first place. Functions,
 * symbols and the rest go the same way, since restoring them is not possible
 * either.
 */
function sanitise(value: unknown): unknown {
  if (value === null) return null;

  const type = typeof value;
  if (type === 'string' || type === 'boolean') return value;
  if (type === 'number') return Number.isFinite(value as number) ? value : OMIT;
  if (type === 'undefined' || type === 'function' || type === 'symbol') {
    return OMIT;
  }
  if (type === 'bigint') return OMIT;

  // Files, blobs and file lists: never persisted, in any position.
  if (typeof File !== 'undefined' && value instanceof File) return OMIT;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return OMIT;
  if (typeof FileList !== 'undefined' && value instanceof FileList) return OMIT;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? OMIT : value.toISOString();
  }

  if (Array.isArray(value)) {
    // Dropped entries are removed rather than left as holes, so an item list
    // comes back with the rows the user actually typed and nothing else.
    const items: unknown[] = [];
    for (const entry of value) {
      const kept = sanitise(entry);
      if (kept !== OMIT) items.push(kept);
    }
    return items;
  }

  if (type === 'object') {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
      const kept = sanitise(source[key]);
      if (kept !== OMIT) result[key] = kept;
    }
    return result;
  }

  return OMIT;
}

/**
 * The persistable form of some form values.
 *
 * Exported because the hook compares this, not the raw values, when deciding
 * whether anything has actually changed. Comparing the raw values would see a
 * new `File` object on every render and write a draft that differs from the
 * last one only in the part that is never stored.
 *
 * @returns The sanitised values, or null if they cannot be serialised at all.
 */
export function serialiseDraftValues(values: unknown): string | null {
  try {
    const cleaned = sanitise(values);
    if (cleaned === OMIT) return null;
    return JSON.stringify(cleaned);
  } catch {
    // A cycle, or a getter that throws. Neither is worth breaking a form over.
    return null;
  }
}

/** Every draft key currently in the store, in no particular order. */
function draftKeys(store: Storage): string[] {
  const keys: string[] = [];
  try {
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key?.startsWith(`${DRAFT_KEY_PREFIX}:`)) keys.push(key);
    }
  } catch {
    // A store that cannot be enumerated is treated as empty; the caller's own
    // read and write are guarded independently.
  }
  return keys;
}

/** Reads and validates one envelope, without applying the age limit. */
function readEnvelope(store: Storage, key: string): DraftEnvelope | null {
  try {
    const raw = store.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DraftEnvelope>;
    if (typeof parsed?.savedAt !== 'number' || !Number.isFinite(parsed.savedAt))
      return null;
    if (parsed.values === undefined) return null;

    return { savedAt: parsed.savedAt, values: parsed.values };
  } catch {
    return null;
  }
}

/** Removes a key, ignoring a store that will not co-operate. */
function removeKey(store: Storage, key: string): void {
  try {
    store.removeItem(key);
  } catch {
    // Nothing further to try.
  }
}

/**
 * Enforces the age and count limits.
 *
 * Expired entries go first, then the oldest of whatever is left until the count
 * is inside the cap. Called before every write, which keeps the store bounded
 * without needing anything to run on a timer.
 *
 * @param now - Current time in epoch milliseconds.
 * @param headroom - Extra entries to evict beyond the cap. Used when a write
 *   has just failed for want of space, where clearing exactly one slot is
 *   unlikely to be enough.
 * @returns How many entries were removed.
 */
export function pruneFormDrafts(now: number, headroom = 0): number {
  const store = getStore();
  if (!store) return 0;

  const surviving: { key: string; savedAt: number }[] = [];
  let removed = 0;

  for (const key of draftKeys(store)) {
    const envelope = readEnvelope(store, key);

    // Unreadable entries are removed too: they are taking up quota and can
    // never be offered to anyone.
    if (!envelope) {
      removeKey(store, key);
      removed += 1;
      continue;
    }

    if (now - envelope.savedAt >= FORM_DRAFT_LIMITS.MAX_AGE_MS) {
      removeKey(store, key);
      removed += 1;
      continue;
    }

    surviving.push({ key, savedAt: envelope.savedAt });
  }

  const allowed = Math.max(FORM_DRAFT_LIMITS.MAX_ENTRIES - headroom, 0);
  if (surviving.length <= allowed) return removed;

  // Oldest first, so the form someone is most likely still coming back to is
  // the last one to be given up.
  surviving.sort((a, b) => a.savedAt - b.savedAt);
  for (const entry of surviving.slice(0, surviving.length - allowed)) {
    removeKey(store, entry.key);
    removed += 1;
  }

  return removed;
}

/**
 * Reads the draft for a key, if there is a live one.
 *
 * An expired draft is removed as it is read, so the age limit holds even for a
 * form nobody opens often enough for a prune to reach it.
 *
 * @param key - From {@link formDraftKey}. A null key has no draft by definition.
 * @param now - Current time in epoch milliseconds.
 */
export function readFormDraft<T>(
  key: string | null,
  now: number = Date.now()
): StoredFormDraft<T> | null {
  if (!key) return null;

  const store = getStore();
  if (!store) return null;

  const envelope = readEnvelope(store, key);
  if (!envelope) return null;

  if (now - envelope.savedAt >= FORM_DRAFT_LIMITS.MAX_AGE_MS) {
    removeKey(store, key);
    return null;
  }

  return { savedAt: envelope.savedAt, values: envelope.values as T };
}

/**
 * Writes a draft, giving up quietly if it cannot.
 *
 * The quota is the interesting failure. Hitting it means something else on the
 * origin has filled the store, and the response is to give up the oldest drafts
 * and try once more; a form that cannot save a draft is a form that has lost a
 * convenience, while a form that throws mid-keystroke has lost the user's work
 * for real.
 *
 * @param key - From {@link formDraftKey}.
 * @param serialised - From {@link serialiseDraftValues}.
 * @param now - Current time in epoch milliseconds.
 * @returns Whether the draft was stored.
 */
export function writeFormDraft(
  key: string | null,
  serialised: string | null,
  now: number = Date.now()
): boolean {
  if (!key || serialised === null) return false;

  const store = getStore();
  if (!store) return false;

  // Room is made before the write rather than after a failure, so the common
  // case never has to hit the quota to discover it is full. A key that is not
  // already there needs a slot of its own, or the cap would be one out and the
  // store would settle one entry above it forever.
  let isNewEntry = true;
  try {
    isNewEntry = store.getItem(key) === null;
  } catch {
    // Treated as new, which only ever prunes slightly harder.
  }
  pruneFormDrafts(now, isNewEntry ? 1 : 0);

  const payload = `{"savedAt":${now},"values":${serialised}}`;

  try {
    store.setItem(key, payload);
    return true;
  } catch {
    // Out of space. Clear a real amount, not one entry, and try once. A second
    // failure means the store is full of something that is not ours to evict.
    pruneFormDrafts(now, Math.ceil(FORM_DRAFT_LIMITS.MAX_ENTRIES / 2));
    try {
      store.setItem(key, payload);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Listeners notified when a draft is cleared, keyed by draft key.
 *
 * A form can be told its draft has gone by something outside it: the page
 * clearing on a successful submit, or the sign-out sweep. Without this, a write
 * already queued behind the debounce would land moments later and put the draft
 * straight back, which for the sign-out case means the data the sweep exists to
 * remove.
 */
const clearListeners = new Map<string, Set<() => void>>();

/**
 * Subscribes to clears of one draft key.
 *
 * @returns An unsubscribe function.
 */
export function onFormDraftCleared(
  key: string | null,
  listener: () => void
): () => void {
  if (!key) return () => {};

  const existing = clearListeners.get(key);
  if (existing) {
    existing.add(listener);
  } else {
    clearListeners.set(key, new Set([listener]));
  }

  return () => {
    const listeners = clearListeners.get(key);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) clearListeners.delete(key);
  };
}

/** Tells anything watching this key that its draft is gone. */
function notifyCleared(key: string): void {
  const listeners = clearListeners.get(key);
  if (!listeners) return;

  // Iterated over a copy: a listener is free to unsubscribe as it runs, and
  // mutating the set mid-iteration would skip whoever came after it.
  const snapshot = [...listeners];
  for (const listener of snapshot) {
    try {
      listener();
    } catch {
      // A listener that throws must not stop the rest from being told.
    }
  }
}

/**
 * Removes one draft.
 *
 * Called when the user discards it, and when the record it belongs to has been
 * saved. A draft that outlives its submission is restored over a completed
 * record the next time the form is opened.
 *
 * @param key - From {@link formDraftKey}.
 */
export function clearFormDraft(key: string | null): void {
  if (!key) return;

  const store = getStore();
  if (store) removeKey(store, key);

  notifyCleared(key);
}

/**
 * Removes every draft on this profile.
 *
 * This is the sign-out sweep, and it is the reason drafts are allowed to hold
 * what they hold. A draft carries employee names, wages, vendor terms and site
 * detail, and on a shared site machine none of that may still be readable after
 * the person who typed it has signed out. Deliberate sign-out and forced
 * sign-out both come through here.
 */
export function clearAllFormDrafts(): void {
  const store = getStore();

  if (store) {
    for (const key of draftKeys(store)) removeKey(store, key);
  }

  // Every open form is told, not only the ones with something already on disk.
  // A form being typed into at the moment of sign-out has its write sitting out
  // the debounce and nothing in the store to sweep, so keying the notification
  // off what was found would let that write land seconds later and put the data
  // back, which is precisely what the sweep is here to prevent.
  // A copy again: notifying can remove the entry being iterated.
  const watched = [...clearListeners.keys()];
  for (const key of watched) notifyCleared(key);
}
