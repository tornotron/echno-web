import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';
import * as realSiteTransferHooks from '@tornotron/echno-core/site-transfers/hooks';

/**
 * The transfer list the mocked `useSiteTransfers` hands back. It starts empty
 * because that is the state of the cache on the first render, before the
 * request resolves. Reassigning it and re-rendering reproduces the load.
 */
let transfers: { transferNumber: string }[] = [];

mock.module('@tornotron/echno-core/site-transfers/hooks', () => ({
  ...realSiteTransferHooks,
  useSiteTransfers: () => ({ data: transfers }),
}));
mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({ data: [] }),
  useMaterialWithStock: () => ({ data: undefined }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [] }),
}));
mock.module('@tornotron/echno-core/storage-locations/hooks', () => ({
  ...realStorageLocationHooks,
  useStorageLocations: () => ({ data: [] }),
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

const { SiteTransferForm } = await import('./site-transfer-form');

const year = new Date().getFullYear();

function transferNumberField(container: HTMLElement) {
  return (container.querySelector('#transferNumber') as HTMLInputElement).value;
}

describe('SiteTransferForm transfer number', () => {
  afterEach(() => {
    cleanup();
    transfers = [];
  });

  test('advances past the transfer numbers already on the server', () => {
    // First render: the list query has not resolved, so the form has nothing to
    // count from and offers the first number of the year.
    const { container, rerender } = render(
      createElement(SiteTransferForm, { onSubmit: () => {} })
    );
    expect(transferNumberField(container)).toBe(`TRF-${year}-000001`);

    // The list resolves and it already holds that number. The form has to move
    // on; leaving it where it is guarantees a duplicate on submit.
    transfers = [{ transferNumber: `TRF-${year}-000001` }];
    rerender(createElement(SiteTransferForm, { onSubmit: () => {} }));

    expect(transferNumberField(container)).toBe(`TRF-${year}-000002`);
  });

  test('keeps following the list as later transfers arrive', () => {
    const { container, rerender } = render(
      createElement(SiteTransferForm, { onSubmit: () => {} })
    );

    transfers = [{ transferNumber: `TRF-${year}-000001` }];
    rerender(createElement(SiteTransferForm, { onSubmit: () => {} }));
    expect(transferNumberField(container)).toBe(`TRF-${year}-000002`);

    // A second page of the list, or a refetch after someone else created one.
    transfers = [
      { transferNumber: `TRF-${year}-000001` },
      { transferNumber: `TRF-${year}-000007` },
    ];
    rerender(createElement(SiteTransferForm, { onSubmit: () => {} }));
    expect(transferNumberField(container)).toBe(`TRF-${year}-000008`);
  });
});
