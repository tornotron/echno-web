import { afterEach, describe, expect, mock, test } from 'bun:test';
import { act, renderHook } from '@testing-library/react';

// Capture toast.error calls without pulling in sonner's DOM machinery.
const toastErrorCalls: Array<{ title: string; opts?: unknown }> = [];
mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    error: (title: string, opts?: unknown) =>
      toastErrorCalls.push({ title, opts }),
    success: () => {},
    warning: () => {},
    info: () => {},
  },
}));

const { useEntityForm } = await import('./use-entity-form');

type Form = { name: string; email: string };
const INITIAL: Form = { name: '', email: '' };
const validate = (f: Form) => (f.name ? {} : { name: 'Name is required' });

function submitEvent() {
  let prevented = false;
  return {
    event: {
      preventDefault: () => {
        prevented = true;
      },
    } as unknown as React.FormEvent,
    wasPrevented: () => prevented,
  };
}

afterEach(() => {
  toastErrorCalls.length = 0;
});

describe('useEntityForm.set', () => {
  test('updates a field value', () => {
    const { result } = renderHook(() => useEntityForm(INITIAL, validate));
    act(() => result.current.set('name', 'Anjali'));
    expect(result.current.form.name).toBe('Anjali');
  });

  test('clears that field error when the field is edited', () => {
    const { result } = renderHook(() => useEntityForm(INITIAL, validate));
    // Trigger validation to populate the name error.
    act(() => result.current.handleSubmit(() => {})(submitEvent().event));
    expect(result.current.errors.name).toBe('Name is required');
    // Editing the field clears its error.
    act(() => result.current.set('name', 'Anjali'));
    expect(result.current.errors.name).toBeUndefined();
  });
});

describe('useEntityForm.handleSubmit', () => {
  test('prevents default and, on invalid, toasts and skips onValid', () => {
    const { result } = renderHook(() => useEntityForm(INITIAL, validate));
    let onValidCalled = false;
    const s = submitEvent();
    act(() =>
      result.current.handleSubmit(() => {
        onValidCalled = true;
      })(s.event)
    );
    expect(s.wasPrevented()).toBe(true);
    expect(onValidCalled).toBe(false);
    expect(toastErrorCalls).toHaveLength(1);
    expect(toastErrorCalls[0].title).toBe('Validation Error');
    expect(result.current.errors.name).toBe('Name is required');
  });

  test('on valid, calls onValid with the current form and does not toast', () => {
    const { result } = renderHook(() => useEntityForm(INITIAL, validate));
    act(() => result.current.set('name', 'Anjali'));
    let received: Form | undefined;
    act(() =>
      result.current.handleSubmit((form) => {
        received = form;
      })(submitEvent().event)
    );
    expect(received).toEqual({ name: 'Anjali', email: '' });
    expect(toastErrorCalls).toHaveLength(0);
  });
});
