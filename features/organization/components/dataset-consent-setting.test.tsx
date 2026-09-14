import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import * as realOrgHooks from '@tornotron/echno-core/organization/hooks';
import { ApiError } from '@/lib/api/api-client';

/**
 * The dataset-consent toggle (#450). Pinned: a system admin sees the stored
 * flag and can change it; switching it on goes through a confirm step that
 * carries the consent text; withdrawing sends false straight away; anyone
 * else sees the state read-only, or "Admin only" when the backend refuses
 * the read.
 */

let isSystemAdmin = true;
let stored: { organizationId: number; datasetConsent: boolean } | undefined;
let readError: Error | undefined;
const setCalls: Array<{ id: number; data: { datasetConsent: boolean } }> = [];

mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => ({ isSystemAdmin, isLoading: false }),
}));

mock.module('@tornotron/echno-core/organization/hooks', () => ({
  ...realOrgHooks,
  useDatasetConsent: () => ({
    data: readError ? undefined : stored,
    isPending: false,
    isSuccess: !readError,
    isError: !!readError,
    error: readError,
  }),
  useSetDatasetConsent: () => ({
    isPending: false,
    mutateAsync: (args: { id: number; data: { datasetConsent: boolean } }) => {
      setCalls.push(args);
      return Promise.resolve({ organizationId: args.id, ...args.data });
    },
  }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { DatasetConsentSetting, DATASET_CONSENT_POINTS } = await import(
  './dataset-consent-setting'
);

function renderSetting() {
  const client = new QueryClient();
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(DatasetConsentSetting, { organizationId: 7 })
    )
  );
}

const toggle = () =>
  document.querySelector('[aria-label="Dataset consent"]') as HTMLButtonElement;

beforeEach(() => {
  isSystemAdmin = true;
  stored = { organizationId: 7, datasetConsent: false };
  readError = undefined;
  setCalls.length = 0;
});

afterEach(() => cleanup());

describe('DatasetConsentSetting', () => {
  test('switching on asks for confirmation with the consent text, then records true', async () => {
    renderSetting();
    expect(document.body.textContent).toContain('Not consented');
    expect(toggle().disabled).toBe(false);
    fireEvent.click(toggle());
    expect(setCalls).toEqual([]);
    const dialog = document.querySelector('[role="alertdialog"]');
    expect(dialog).not.toBeNull();
    for (const point of DATASET_CONSENT_POINTS) {
      expect(dialog!.textContent).toContain(point);
    }
    expect(dialog!.textContent).toContain('blurred');
    const confirm = [...dialog!.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Record consent')
    )!;
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(setCalls).toEqual([{ id: 7, data: { datasetConsent: true } }]);
  });

  test('withdrawing sends false without a confirm step', async () => {
    stored = { organizationId: 7, datasetConsent: true };
    renderSetting();
    expect(document.body.textContent).toContain('Consented');
    await act(async () => {
      fireEvent.click(toggle());
    });
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(setCalls).toEqual([{ id: 7, data: { datasetConsent: false } }]);
  });

  test('a non-admin sees the state but cannot change it', () => {
    isSystemAdmin = false;
    stored = { organizationId: 7, datasetConsent: true };
    renderSetting();
    expect(document.body.textContent).toContain('Consented');
    expect(toggle().disabled).toBe(true);
    fireEvent.click(toggle());
    expect(setCalls).toEqual([]);
  });

  test('a 403 on the read shows admin-only instead of a switch', () => {
    isSystemAdmin = false;
    readError = new ApiError('forbidden', 403);
    renderSetting();
    expect(document.body.textContent).toContain('Admin only');
    expect(toggle()).toBeNull();
  });
});
