import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({ data: [{ id: 2, materialName: 'TNT Steel' }] }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [] }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
}));

const { IndentForm } = await import('./indent-form');

/**
 * `DocumentNumberAllocator` allocates the indent number per organization,
 * document type and year, and `IndentService` calls it unconditionally before
 * it saves. `IndentCreationDto` declares no `indentNumber`, so the key the
 * browser sent was read off nothing and dropped.
 *
 * This was one of the two screens that made it a required, editable input.
 * Somebody could type a number, be told the indent was created, and find it
 * filed under whatever the allocator answered, with no way to tell from this
 * screen that the two differed.
 *
 * The number is still amendable afterwards: `IndentUpdateDto` does declare
 * `indentNumber`, and `indent-info-card.tsx` edits it through
 * `indentsService.update`. That path is deliberate and stays.
 */
describe('IndentForm indent number', () => {
  afterEach(() => {
    cleanup();
  });

  test('the form does not ask for an indent number', () => {
    const { container } = render(
      createElement(IndentForm, { onSubmit: () => {} })
    );

    // Asserted as a boolean on purpose: a failing assertion that prints a
    // Radix DOM node hangs the reporter rather than reporting.
    expect(container.querySelector('#indentNumber') === null).toBe(true);
    expect(container.textContent).not.toContain('Indent Number');
  });

  test('an empty indent number is not what blocks the submit', () => {
    const { container } = render(
      createElement(IndentForm, { onSubmit: () => {} })
    );

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(container.textContent).not.toContain('Indent number is required');
  });

  test('nothing named indentNumber reaches the submit payload', () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(createElement(IndentForm, { onSubmit }));

    // One filled row is all the remaining validation asks for. The item rows
    // carry no ids, so the material select is reached through the table body.
    const trigger = container.querySelector(
      'tbody [role="combobox"]'
    ) as HTMLElement;
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const option = [...document.body.querySelectorAll('[role="option"]')].find(
      (o) => o.textContent?.includes('TNT Steel')
    );
    if (!option) throw new Error('the material was not offered');
    fireEvent.click(option);

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: Record<string, unknown>;
    };
    expect(Object.keys(submitted.form)).not.toContain('indentNumber');
  });
});
