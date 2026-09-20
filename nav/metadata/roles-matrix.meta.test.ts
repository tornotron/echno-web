import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { financeMetadata } from './finance.meta';
import { projectsMetadata } from './projects.meta';
import { thirdPartyMetadata } from './third-party.meta';
import {
  ASSET_WRITE_ACCESS,
  CONSTRUCTION_INVOICES_ACCESS,
  LABOUR_ACCESS,
  PROJECT_WRITE_ACCESS,
  STOCK_ADJUSTMENT_DECIDE_ACCESS,
  STORAGE_LOCATION_WRITE_ACCESS,
  SUB_CONTRACT_WRITE_ACCESS,
  VENDOR_READ_ACCESS,
  VENDOR_WRITE_ACCESS,
} from '../access/roles';

/**
 * Pins the org roles each roles-matrix gate names (echno-backend #853) and
 * which finance, project and third-party routes carry them. The backend's
 * `EndpointAuthorizationTest` pins the same rows from its side, so a change
 * to either has to be made in both places on purpose.
 */
describe('roles-matrix gates name the backend guard exactly', () => {
  const pair = [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER];

  test('each gate is org-role only, with the roles the matrix row names', () => {
    const expected: [
      string,
      { allowOrgRoles?: readonly string[] },
      string[],
    ][] = [
      ['PROJECT_WRITE_ACCESS', PROJECT_WRITE_ACCESS, pair],
      ['CONSTRUCTION_INVOICES_ACCESS', CONSTRUCTION_INVOICES_ACCESS, pair],
      [
        'STORAGE_LOCATION_WRITE_ACCESS',
        STORAGE_LOCATION_WRITE_ACCESS,
        [OrgRole.SYSTEM_ADMIN],
      ],
      ['ASSET_WRITE_ACCESS', ASSET_WRITE_ACCESS, pair],
      ['STOCK_ADJUSTMENT_DECIDE_ACCESS', STOCK_ADJUSTMENT_DECIDE_ACCESS, pair],
      [
        'VENDOR_READ_ACCESS',
        VENDOR_READ_ACCESS,
        [OrgRole.SYSTEM_ADMIN, OrgRole.STORE_KEEPER],
      ],
      ['VENDOR_WRITE_ACCESS', VENDOR_WRITE_ACCESS, [OrgRole.SYSTEM_ADMIN]],
      [
        'LABOUR_ACCESS',
        LABOUR_ACCESS,
        [OrgRole.SYSTEM_ADMIN, OrgRole.HR_ADMIN],
      ],
      ['SUB_CONTRACT_WRITE_ACCESS', SUB_CONTRACT_WRITE_ACCESS, pair],
    ];
    for (const [name, config, roles] of expected) {
      expect(config.allowOrgRoles, name).toEqual(roles);
      expect(
        (config as { allowRoles?: unknown }).allowRoles,
        name
      ).toBeUndefined();
    }
  });

  test('a director, a site manager and an HR manager are outside the project pair', () => {
    // The coarse tiers would admit all three; the backend refuses them.
    for (const role of [
      OrgRole.DIRECTOR,
      OrgRole.SITE_MANAGER,
      OrgRole.HR_ADMIN,
    ]) {
      expect(PROJECT_WRITE_ACCESS.allowOrgRoles, role).not.toContain(role);
    }
  });
});

describe('construction invoices are gated on every route', () => {
  test('list, new, detail and edit carry the gate and hide when locked', () => {
    for (const id of [
      'finance-invoices',
      'finance-invoices-new',
      'finance-invoices-[id]',
      'finance-invoices-[id]-edit',
    ] as const) {
      expect(financeMetadata[id].access, id).toBe(CONSTRUCTION_INVOICES_ACCESS);
      expect(financeMetadata[id].hideWhenLocked, id).toBe(true);
    }
  });

  test('no other finance route picked the gate up by accident', () => {
    const others = Object.entries(financeMetadata).filter(
      ([id]) => !id.startsWith('finance-invoices')
    );
    for (const [id, meta] of others) {
      expect(meta.access, id).not.toBe(CONSTRUCTION_INVOICES_ACCESS);
    }
  });
});

describe('issues: any member reads, the project pair writes', () => {
  test('the new and edit routes carry the write gate', () => {
    for (const id of [
      'projects-all-projects-[id]-issues-new',
      'projects-all-projects-[id]-issues-[issueId]-edit',
    ] as const) {
      expect(projectsMetadata[id].access, id).toBe(PROJECT_WRITE_ACCESS);
      expect(projectsMetadata[id].hideWhenLocked, id).toBe(true);
    }
  });

  test('the lists and the detail stay open', () => {
    for (const id of [
      'projects-all-issues',
      'projects-all-projects-[id]-issues',
      'projects-all-projects-[id]-issues-[issueId]',
    ] as const) {
      expect(projectsMetadata[id].access, id).toBeUndefined();
    }
  });
});

describe('third party mirrors its backend guards', () => {
  test('labour is HR and the administrator throughout', () => {
    for (const id of [
      'third-party-labour',
      'third-party-labour-new',
      'third-party-labour-[id]',
      'third-party-labour-[id]-edit',
    ] as const) {
      expect(thirdPartyMetadata[id].access, id).toBe(LABOUR_ACCESS);
      expect(thirdPartyMetadata[id].hideWhenLocked, id).toBe(true);
    }
  });

  test('vendors are read by the store and written by the administrator', () => {
    expect(thirdPartyMetadata['third-party-vendors'].access).toBe(
      VENDOR_READ_ACCESS
    );
    expect(thirdPartyMetadata['third-party-vendors-[id]'].access).toBe(
      VENDOR_READ_ACCESS
    );
    expect(thirdPartyMetadata['third-party-vendors-new'].access).toBe(
      VENDOR_WRITE_ACCESS
    );
    expect(thirdPartyMetadata['third-party-vendors-[id]-edit'].access).toBe(
      VENDOR_WRITE_ACCESS
    );
  });

  test('sub-contracts are read by any member and written by the project pair', () => {
    expect(
      thirdPartyMetadata['third-party-sub-contracts'].access
    ).toBeUndefined();
    expect(
      thirdPartyMetadata['third-party-sub-contracts-[id]'].access
    ).toBeUndefined();
    expect(thirdPartyMetadata['third-party-sub-contracts-new'].access).toBe(
      SUB_CONTRACT_WRITE_ACCESS
    );
    expect(
      thirdPartyMetadata['third-party-sub-contracts-[id]-edit'].access
    ).toBe(SUB_CONTRACT_WRITE_ACCESS);
  });

  test('the section root stays open so the group still renders', () => {
    expect(thirdPartyMetadata['third-party'].access).toBeUndefined();
  });
});
