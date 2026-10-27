/**
 * Seed data for the access-control mock service. Stands in for the backend
 * until it exposes roles, groups and module permissions; see
 * `access-control-service.ts`.
 */
import {
  ACCESS_MODULES,
  type AccessGroup,
  type AccessAction,
  type AccessRole,
  type AccessUser,
  type PermissionMap,
} from '@/types/access-control';

const ACTION_CODES: Record<string, AccessAction[]> = {
  N: [],
  V: ['view'],
  A: ['view', 'approve'],
  E: ['view', 'create', 'edit'],
  P: ['view', 'create', 'edit', 'approve'],
  F: ['view', 'create', 'edit', 'approve', 'delete'],
};

/**
 * Expands one matrix column, a letter per module in {@link ACCESS_MODULES}
 * order, into a permission map: N nothing, V view, A view and approve,
 * E view, create and edit, P those three and approve, F all five.
 */
export function permissionsFromCodes(codes: string): PermissionMap {
  if (codes.length !== ACCESS_MODULES.length) {
    throw new Error(
      `Expected ${ACCESS_MODULES.length} access codes, got ${codes.length}`
    );
  }
  return Object.fromEntries(
    ACCESS_MODULES.map((m, i) => [m.id, [...ACTION_CODES[codes[i]]]])
  );
}

export const seedUsers: AccessUser[] = [
  {
    id: 1,
    name: 'Anand R',
    email: 'anand.r@kh25.in',
    designation: 'Project Manager',
    isActive: true,
    permissions: {},
  },
  {
    id: 2,
    name: 'Meera Nair',
    email: 'meera.nair@kh25.in',
    designation: 'System Administrator',
    isActive: true,
    permissions: {},
  },
  {
    id: 3,
    name: 'Rahul Menon',
    email: 'rahul.menon@kh25.in',
    designation: 'Director',
    isActive: true,
    permissions: {},
  },
  {
    id: 4,
    name: 'Priya Thomas',
    email: 'priya.thomas@kh25.in',
    designation: 'Project Manager',
    isActive: true,
    permissions: {},
  },
  {
    id: 5,
    name: 'Arjun Pillai',
    email: 'arjun.pillai@kh25.in',
    designation: 'Site Engineer',
    isActive: true,
    permissions: {},
  },
  {
    id: 6,
    name: 'Sneha Varghese',
    email: 'sneha.varghese@kh25.in',
    designation: 'Site Engineer',
    isActive: true,
    permissions: { reports: ['view'] },
  },
  {
    id: 7,
    name: 'Vishnu Das',
    email: 'vishnu.das@kh25.in',
    designation: 'QA/QC Engineer',
    isActive: true,
    permissions: {},
  },
  {
    id: 8,
    name: 'Fathima S',
    email: 'fathima.s@kh25.in',
    designation: 'Procurement Manager',
    isActive: true,
    permissions: {},
  },
  {
    id: 9,
    name: 'Joseph K',
    email: 'joseph.k@kh25.in',
    designation: 'Store Keeper',
    isActive: true,
    permissions: {},
  },
  {
    id: 10,
    name: 'Lakshmi Iyer',
    email: 'lakshmi.iyer@kh25.in',
    designation: 'Finance Manager',
    isActive: true,
    permissions: {},
  },
  {
    id: 11,
    name: 'Kiran Babu',
    email: 'kiran.babu@kh25.in',
    designation: 'Project Engineer',
    isActive: true,
    permissions: {},
  },
  {
    id: 12,
    name: 'Deepa Mohan',
    email: 'deepa.mohan@kh25.in',
    designation: 'Planning Engineer',
    isActive: true,
    permissions: { wbs: ['view', 'create', 'edit'] },
  },
  {
    id: 13,
    name: 'Nikhil George',
    email: 'nikhil.george@client.in',
    designation: 'Owner Representative',
    isActive: true,
    permissions: {},
  },
  {
    id: 14,
    name: 'Asha Kurian',
    email: 'asha.kurian@kh25.in',
    designation: 'Internal Auditor',
    isActive: false,
    permissions: {},
  },
];

export const seedRoles: AccessRole[] = [
  {
    id: 1,
    name: 'Admin',
    subtitle: 'System Admin',
    description:
      'Full control over every module, user and setting in the organization.',
    isSystem: true,
    permissions: permissionsFromCodes('FFFFFFFFFFFFFFFFFFFFF'),
    userIds: [2],
  },
  {
    id: 2,
    name: 'Director',
    subtitle: 'Management',
    description:
      'Oversees projects and the organization; reads most modules and shapes project plans.',
    isSystem: false,
    permissions: permissionsFromCodes('VEEVVVVVVAVVVNAEVAVVV'),
    userIds: [3],
  },
  {
    id: 3,
    name: 'Project Manager',
    subtitle: 'Project',
    description:
      'Manages project planning, execution, site teams, and progress. Has edit access to key project modules.',
    isSystem: false,
    permissions: permissionsFromCodes('VEEEVEEVVVVVVNAVEPPVV'),
    userIds: [1, 4, 11],
  },
  {
    id: 4,
    name: 'Site Engineer',
    subtitle: 'Site Execution',
    description:
      'Records progress on site and works the daily construction activities.',
    isSystem: false,
    permissions: permissionsFromCodes('VVVEVVVNNNNNNNNNNNNNE'),
    userIds: [5, 6],
  },
  {
    id: 5,
    name: 'QA/QC Engineer',
    subtitle: 'Quality',
    description: 'Raises and closes inspections, observations and NCRs.',
    isSystem: false,
    permissions: permissionsFromCodes('VVVVPVNNNNNNNNNVNNNNV'),
    userIds: [7],
  },
  {
    id: 6,
    name: 'Procurement Manager',
    subtitle: 'Procurement',
    description:
      'Sources vendors and runs purchase orders through to goods receipt.',
    isSystem: false,
    permissions: permissionsFromCodes('VNNNNVEEEEEEENNENNNEN'),
    userIds: [8],
  },
  {
    id: 7,
    name: 'Store Keeper',
    subtitle: 'Store',
    description:
      'Books goods in, issues material out and keeps the store ledger.',
    isSystem: false,
    permissions: permissionsFromCodes('VNNNNNNNNVEEEVVVNNNNN'),
    userIds: [9],
  },
  {
    id: 8,
    name: 'Finance Manager',
    subtitle: 'Finance',
    description: 'Runs the ledger, invoices and payments.',
    isSystem: false,
    permissions: permissionsFromCodes('VNNNNNNNNNNNNPVNNNNNV'),
    userIds: [10],
  },
  {
    id: 9,
    name: 'Client',
    subtitle: 'Client / Owner',
    description:
      "The owner's representative: reads progress, inspections and shared documents.",
    isSystem: false,
    permissions: permissionsFromCodes('VNNNANNNNNNNNNNVNNNNV'),
    userIds: [13],
  },
];

export const seedGroups: AccessGroup[] = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Project and site engineering staff.',
    kind: 'department',
    permissions: { documents: ['view'] },
    roleIds: [3, 4, 5],
    userIds: [12],
  },
  {
    id: 2,
    name: 'Procurement & Stores',
    description: 'Buying, receiving and storing material.',
    kind: 'department',
    permissions: { reports: ['view'] },
    roleIds: [6, 7],
    userIds: [],
  },
  {
    id: 3,
    name: 'Finance & Accounts',
    description: 'Ledger, invoicing and payments.',
    kind: 'department',
    permissions: {},
    roleIds: [8],
    userIds: [],
  },
  {
    id: 4,
    name: 'Site Leadership',
    description: 'Everyone who signs off work on site.',
    kind: 'group',
    permissions: { compliance: ['view', 'create', 'edit'] },
    roleIds: [3],
    userIds: [5],
  },
  {
    id: 5,
    name: 'Auditors',
    description: 'Read-only reviewers of the commercial record.',
    kind: 'group',
    permissions: { finance: ['view'], compliance: ['view'], reports: ['view'] },
    roleIds: [],
    userIds: [14],
  },
];
