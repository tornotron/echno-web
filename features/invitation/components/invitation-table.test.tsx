/**
 * The invitations table across every stage. Pinned: each stage reads by its
 * label; only a pending or expired invitation offers resend and revoke, with
 * the expiry beside resend saying whether it is kept or renewed; resend and
 * revoke go out with the invitation's id; roles read by name, with their
 * project. Every module replaced here is put back when the file ends.
 *
 * Assertions are on strings, counts and booleans, never on a rendered node.
 */
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import * as realNavigation from 'next/navigation';
import * as realAccessHooks from '@tornotron/echno-core/access/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realInvitationHooks from '@tornotron/echno-core/member-invitations/hooks';
import * as realToastStyles from '@/lib/styles/toast-styles';
import type {
  MemberInvitation,
  MemberInvitationStage,
} from '@tornotron/echno-core/member-invitations/types';

const originals = {
  navigation: { ...realNavigation },
  access: { ...realAccessHooks },
  project: { ...realProjectHooks },
  invitation: { ...realInvitationHooks },
  toast: { ...realToastStyles },
};

const resent: string[] = [];
const revoked: string[] = [];

mock.module('next/navigation', () => ({
  ...originals.navigation,
  useRouter: () => ({ push: () => {}, replace: () => {} }),
}));
mock.module('@tornotron/echno-core/access/hooks', () => ({
  ...originals.access,
  useAccessRoles: () => ({
    data: [
      {
        id: 'r-se',
        slug: 'site-engineer',
        name: 'Site Engineer',
        system: false,
        baseline: false,
        grants: [],
        memberIds: [],
        grantableRoleIds: [],
      },
      {
        id: 'r-md',
        slug: 'management-director',
        name: 'Management Director',
        system: false,
        baseline: false,
        grants: [],
        memberIds: [],
        grantableRoleIds: [],
      },
    ],
  }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...originals.project,
  useProjects: () => ({ data: [{ id: 7, projectName: 'Tower A' }] }),
}));
mock.module('@tornotron/echno-core/member-invitations/hooks', () => ({
  ...originals.invitation,
  useResendMemberInvitation: () => ({
    isPending: false,
    mutate: (id: string) => resent.push(id),
  }),
  useRevokeMemberInvitation: () => ({
    isPending: false,
    mutate: (id: string) => revoked.push(id),
  }),
}));
mock.module('@/lib/styles/toast-styles', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { InvitationTable } = await import('./invitation-table');

afterAll(() => {
  mock.module('next/navigation', () => originals.navigation);
  mock.module('@tornotron/echno-core/access/hooks', () => originals.access);
  mock.module('@tornotron/echno-core/project/hooks', () => originals.project);
  mock.module(
    '@tornotron/echno-core/member-invitations/hooks',
    () => originals.invitation
  );
  mock.module('@/lib/styles/toast-styles', () => originals.toast);
});

const invitation = (
  status: MemberInvitationStage,
  extra: Partial<MemberInvitation> = {}
): MemberInvitation => ({
  id: `inv-${status}`,
  email: `${status.toLowerCase()}@company.test`,
  status,
  expiresAt: new Date('2026-11-15T10:00:00Z'),
  roles: [],
  employee: { status: 'active' },
  ...extra,
});

function renderTable(invitations: MemberInvitation[]) {
  const client = new QueryClient();
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(InvitationTable, { invitations })
    )
  );
}

const rows = () => [
  ...document.querySelectorAll('[data-testid="invitation-row"]'),
];
const rowFor = (status: MemberInvitationStage) =>
  rows().find((r) =>
    r.textContent?.includes(`${status.toLowerCase()}@company.test`)
  );
const within = (row: Element | undefined, testId: string) =>
  row?.querySelector(`[data-testid="${testId}"]`) ?? null;

beforeEach(() => {
  resent.length = 0;
  revoked.length = 0;
});

afterEach(() => cleanup());

describe('InvitationTable states', () => {
  const all: MemberInvitationStage[] = [
    'PENDING',
    'ACCEPTED',
    'ACCEPTED_BY_ANOTHER_ADDRESS',
    'EXPIRED',
    'REVOKED',
    'UNKNOWN',
  ];

  test('each stage reads by its label', () => {
    renderTable(all.map((s) => invitation(s)));
    expect(rows().length).toBe(6);
    expect(rowFor('ACCEPTED_BY_ANOTHER_ADDRESS')?.textContent).toContain(
      'Accepted by another address'
    );
    expect(rowFor('REVOKED')?.textContent).toContain('Revoked');
    expect(rowFor('UNKNOWN')?.textContent).toContain('Unknown');
  });

  test('only a pending or an expired invitation offers resend and revoke', () => {
    renderTable(all.map((s) => invitation(s)));
    const offering = all.filter(
      (s) => within(rowFor(s), 'invitation-resend') !== null
    );
    expect(offering).toEqual(['PENDING', 'EXPIRED']);
    const revocable = all.filter(
      (s) => within(rowFor(s), 'invitation-revoke') !== null
    );
    expect(revocable).toEqual(['PENDING', 'EXPIRED']);
  });

  test('beside resend, a pending invitation keeps its expiry and an expired one is renewed', () => {
    renderTable([invitation('PENDING'), invitation('EXPIRED')]);
    expect(within(rowFor('PENDING'), 'invitation-resend')?.textContent).toBe(
      'Resend'
    );
    expect(
      within(rowFor('PENDING'), 'invitation-resend-expiry')?.textContent
    ).toContain('A resend keeps this expiry.');
    expect(within(rowFor('EXPIRED'), 'invitation-resend')?.textContent).toBe(
      'Renew and resend'
    );
    expect(
      within(rowFor('EXPIRED'), 'invitation-resend-expiry')?.textContent
    ).toContain('A resend sets a new expiry.');
  });

  test('resend goes out with the invitation id', async () => {
    renderTable([invitation('PENDING')]);
    await act(async () => {
      fireEvent.click(
        within(rowFor('PENDING'), 'invitation-resend') as HTMLElement
      );
    });
    expect(resent).toEqual(['inv-PENDING']);
  });

  test('revoke asks first, then goes out with the invitation id', async () => {
    renderTable([invitation('EXPIRED')]);
    await act(async () => {
      fireEvent.click(
        within(rowFor('EXPIRED'), 'invitation-revoke') as HTMLElement
      );
    });
    expect(revoked).toEqual([]);
    await act(async () => {
      fireEvent.click(
        document.querySelector(
          '[data-testid="invitation-revoke-confirm"]'
        ) as HTMLElement
      );
    });
    expect(revoked).toEqual(['inv-EXPIRED']);
  });
});

describe('InvitationTable roles', () => {
  test('names each role with where it holds', () => {
    renderTable([
      invitation('PENDING', {
        roles: [{ roleId: 'r-se' }, { roleId: 'r-md', projectId: 7 }],
      }),
    ]);
    const text = rowFor('PENDING')?.textContent ?? '';
    expect(text).toContain('Site Engineer, across the organization');
    expect(text).toContain('Management Director on Tower A');
  });

  test('an invitation with no role says what the person gets', () => {
    renderTable([invitation('PENDING')]);
    expect(rowFor('PENDING')?.textContent).toContain('Employee access only');
  });
});
