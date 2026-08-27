'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  clearFormDraft,
  formDraftKey,
  onFormDraftCleared,
  readFormDraft,
  serialiseDraftValues,
  writeFormDraft,
  type FormDraftScope,
  type StoredFormDraft,
} from '@/lib/forms/form-draft-storage';
import type { FormDraftId } from '@/lib/forms/form-draft-ids';

/**
 * How long the form has to sit still before a draft is written.
 *
 * Writing on every keystroke of a fifty field form serialises the whole thing
 * fifty times a sentence for no benefit. Waiting for a pause costs nothing and
 * writes once. The session monitor's own activity debounce is thirty seconds,
 * which is the right number for something that only has to notice that a person
 * is present; a draft is protecting typing, so it settles far sooner, and a
 * flush on the way out of the page covers the gap either way.
 */
export const FORM_DRAFT_DEBOUNCE_MS = 1500;

export interface UseFormDraftOptions<T> {
  /** Which form this is. From `FORM_DRAFT_IDS`. */
  formId: FormDraftId;
  /**
   * Whose draft this is.
   *
   * Taken as an argument rather than read from the session inside this hook, so
   * the behaviour can be exercised without standing up an auth provider. Forms
   * pass {@link useFormDraftScope}.
   */
  scope: FormDraftScope;
  /** The form's current values. */
  values: T;
  /** Applies a restored draft to the form. */
  onRestore: (values: T) => void;
  /**
   * The record being edited, or omitted when creating.
   *
   * An edit of project A and an edit of project B are different drafts, and
   * neither is the draft of a project that does not exist yet.
   */
  recordId?: string | number | null;
  /**
   * What the form hangs off, for forms reached through a parent.
   *
   * A new issue is raised against one project. Without this the create case has
   * only one key per form, and a half typed issue left under one project would
   * be offered on the new-issue form of the next project the user opens.
   */
  contextId?: string | number | null;
  /**
   * Whether to keep a draft at all. Default true.
   *
   * Somewhere to hang a form that is still loading the record it is about to
   * show, where the values on the first render are not yet the user's.
   */
  enabled?: boolean;
  /** Idle time before a write, in milliseconds. */
  debounceMs?: number;
}

export interface FormDraftControls {
  /**
   * The draft waiting to be taken, if there is one.
   *
   * Deliberately carries only the time it was saved. Restoring goes through
   * {@link FormDraftControls.restoreDraft}, so a caller cannot quietly
   * repopulate the fields on mount: someone who is not told a draft was applied
   * submits stale data believing they typed it.
   */
  draft: { savedAt: number } | null;
  /** Applies the offered draft and takes the offer down. */
  restoreDraft: () => void;
  /** Throws the offered draft away. */
  discardDraft: () => void;
}

/**
 * The identity a draft belongs to, from the signed-in session.
 *
 * Both halves matter. Without the user, two people sharing a site machine share
 * drafts. Without the organization, a draft typed for one client's org is
 * offered while the user is working in another's.
 */
export function useFormDraftScope(): FormDraftScope {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const organizationId = session?.user?.defaultOrganizationId;

  return useMemo(() => ({ userId, organizationId }), [userId, organizationId]);
}

/**
 * Keeps a local copy of a half-filled form and offers it back.
 *
 * The problem it solves: a session can end while someone is still typing, and
 * an idle warning does not help a person who has stepped away. Nor does it help
 * when the tab is closed by accident, the browser gives up, or a stray click
 * navigates off a form with twenty minutes of entry in it. The form's values
 * are written to localStorage as they are typed, and the next time that same
 * form is opened by that same user in that same organization for that same
 * record, the draft is offered.
 *
 * Offered, not applied. A form that silently repopulates itself is how someone
 * submits last week's numbers without noticing they did not type them.
 *
 * What this hook does not do: files are never written, drafts expire and are
 * capped in number, a browser that will not give up its storage degrades to no
 * drafts rather than a broken form, and everything is swept on sign-out.
 * See `lib/forms/form-draft-storage.ts` for all of that.
 *
 * @example
 * ```tsx
 * const scope = useFormDraftScope();
 * const { draft, restoreDraft, discardDraft } = useFormDraft({
 *   formId: FORM_DRAFT_IDS.PROJECT,
 *   scope,
 *   recordId: project?.id,
 *   values: form,
 *   onRestore: setForm,
 * });
 *
 * <FormDraftBanner
 *   draft={draft}
 *   onRestore={restoreDraft}
 *   onDiscard={discardDraft}
 * />
 * ```
 */
export function useFormDraft<T>({
  formId,
  scope,
  values,
  onRestore,
  recordId,
  contextId,
  enabled = true,
  debounceMs = FORM_DRAFT_DEBOUNCE_MS,
}: UseFormDraftOptions<T>): FormDraftControls {
  const { userId, organizationId } = scope;

  // A null key means there is nothing safe to key on, which is the case while
  // the session is still loading. Nothing is read or written until there is
  // one, so a draft can never be stored unscoped.
  const key = useMemo(
    () =>
      enabled
        ? formDraftKey(formId, { userId, organizationId }, recordId, contextId)
        : null,
    [enabled, formId, userId, organizationId, recordId, contextId]
  );

  /**
   * The values as they would be stored.
   *
   * The comparisons below run against this rather than against the values
   * themselves: an attachment array holds a new `File` object identity on every
   * change, and comparing the raw values would keep writing drafts that differ
   * only in the part that is never persisted.
   */
  const serialised = useMemo(() => serialiseDraftValues(values), [values]);

  /**
   * Everything that is true of one key: what the form started from, and what
   * was found waiting for it.
   *
   * `baseline` is what makes a draft worth keeping. Until the values differ
   * from what the form was handed, an empty create form or the record an edit
   * form loaded, there is nothing anyone typed and nothing to store; without it
   * every form that was merely opened would leave an entry behind.
   *
   * Held together in one piece of state and settled during render rather than
   * in an effect, so a form never draws once against the previous key's answer.
   */
  const [draftSession, setDraftSession] = useState<{
    key: string | null;
    baseline: string | null;
    offer: StoredFormDraft<T> | null;
  }>({ key: null, baseline: null, offer: null });

  // A new key is a new form. This is React's own way of reacting to a changed
  // input: the render is thrown away and redone immediately, before anything is
  // committed, which is why the read below can be trusted by the same render.
  if (draftSession.key !== key) {
    setDraftSession({
      key,
      baseline: serialised,
      offer: readFormDraft<T>(key),
    });
  }

  const { baseline, offer } = draftSession;

  /** The latest values, for the handlers that fire outside a render. */
  const serialisedRef = useRef(serialised);

  /** Whether anything has actually been written under the current key. */
  const hasWrittenRef = useRef(false);

  /** The write waiting out the debounce, so a clear can cancel it. */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingWrite = useCallback(() => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  // Declared before every effect that reads it, so the page-exit flush below
  // always sees the values from the render that just committed.
  useEffect(() => {
    serialisedRef.current = serialised;
  }, [serialised]);

  useEffect(() => {
    cancelPendingWrite();
    hasWrittenRef.current = false;
  }, [key, cancelPendingWrite]);

  // Persist, once the typing pauses.
  useEffect(() => {
    if (!key || serialised === null) return;

    if (serialised === baseline) {
      // Edited back to where it started. The stored draft now describes nothing
      // the user wants, so it goes rather than waiting out its own expiry.
      if (hasWrittenRef.current) {
        hasWrittenRef.current = false;
        clearFormDraft(key);
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      hasWrittenRef.current = writeFormDraft(key, serialised);
    }, debounceMs);

    return cancelPendingWrite;
  }, [key, serialised, baseline, debounceMs, cancelPendingWrite]);

  // Something outside this form removed its draft: the page that saved the
  // record, or the sign-out sweep. Drop the pending write with it, or it lands
  // moments later and puts back exactly what was just removed.
  useEffect(
    () =>
      onFormDraftCleared(key, () => {
        cancelPendingWrite();
        hasWrittenRef.current = false;
        setDraftSession((previous) => {
          if (previous.key !== key) return previous;
          const settled = serialisedRef.current;
          // Re-baselining here is what stops the next render queueing the same
          // write again: nothing is stored until the user types something new.
          if (previous.offer === null && previous.baseline === settled) {
            return previous;
          }
          return { key, baseline: settled, offer: null };
        });
      }),
    [key, cancelPendingWrite]
  );

  // Write on the way out, without waiting for the debounce.
  //
  // Closing the tab and navigating away are two of the four ways this work gets
  // lost, and both of them happen inside the window the debounce is still
  // counting down. `pagehide` is the event that survives the back/forward cache
  // and mobile Safari, where `beforeunload` does not fire at all.
  useEffect(() => {
    if (!key) return;

    const flush = () => {
      const current = serialisedRef.current;
      if (current === null || current === baseline) return;
      cancelPendingWrite();
      hasWrittenRef.current = writeFormDraft(key, current);
    };

    const flushIfHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    globalThis.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushIfHidden);

    return () => {
      globalThis.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushIfHidden);
    };
  }, [key, baseline, cancelPendingWrite]);

  const restoreDraft = useCallback(() => {
    if (!offer) return;
    onRestore(offer.values);
    setDraftSession((previous) =>
      previous.offer === null ? previous : { ...previous, offer: null }
    );
  }, [offer, onRestore]);

  const discardDraft = useCallback(() => {
    // Removing it notifies the subscription above, which takes the offer down
    // and cancels the pending write, so this stays the one path out.
    clearFormDraft(key);
  }, [key]);

  const draft = useMemo(
    () => (offer ? { savedAt: offer.savedAt } : null),
    [offer]
  );

  return { draft, restoreDraft, discardDraft };
}

/**
 * Removes a form's draft, for the page that owns the save.
 *
 * The form component holds the values but never learns whether the record was
 * accepted; the page runs the mutation and does. Clearing has to happen there,
 * on success and not merely on submit, or a rejected save takes the user's
 * input with it.
 *
 * @returns A function taking the same form id and record id the form was given.
 */
export function useClearFormDraft(): (
  formId: FormDraftId,
  recordId?: string | number | null,
  contextId?: string | number | null
) => void {
  const { userId, organizationId } = useFormDraftScope();

  return useCallback(
    (
      formId: FormDraftId,
      recordId?: string | number | null,
      contextId?: string | number | null
    ) => {
      clearFormDraft(
        formDraftKey(formId, { userId, organizationId }, recordId, contextId)
      );
    },
    [userId, organizationId]
  );
}
