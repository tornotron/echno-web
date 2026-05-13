/**
 * nav/generated/route-helpers.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `pnpm routes:generate` to regenerate from the filesystem.
 *
 * Source: app/users/dashboard (scanned recursively)
 * Generated: 2026-05-13
 */

const BASE = '/users/dashboard';
const b = (path: string) => `${BASE}${path}`;

export const routes = {
  href: b(''),

  attendance: {
    href: b('/attendance'),
    mark: b('/attendance/mark'),
    settings: b('/attendance/settings'),
    detail: (id: string | number) => ({ href: b(`/attendance/${id}`) }),
  },

  chat: {
    href: b('/chat'),
    detail: (roomId: string | number) => ({ href: b(`/chat/${roomId}`) }),
  },

  finance: {
    href: b('/finance'),
    budgets: {
      href: b('/finance/budgets'),
      new: b('/finance/budgets/new'),
      detail: (id: string | number) => ({
        href: b(`/finance/budgets/${id}`),
        edit: b(`/finance/budgets/${id}/edit`),
      }),
    },
    expenses: {
      href: b('/finance/expenses'),
      new: b('/finance/expenses/new'),
      detail: (id: string | number) => ({
        href: b(`/finance/expenses/${id}`),
        edit: b(`/finance/expenses/${id}/edit`),
      }),
    },
    invoices: {
      href: b('/finance/invoices'),
      new: b('/finance/invoices/new'),
      detail: (id: string | number) => ({
        href: b(`/finance/invoices/${id}`),
        edit: b(`/finance/invoices/${id}/edit`),
      }),
    },
    payments: {
      href: b('/finance/payments'),
      new: b('/finance/payments/new'),
      detail: (id: string | number) => ({
        href: b(`/finance/payments/${id}`),
        edit: b(`/finance/payments/${id}/edit`),
      }),
    },
    receipts: {
      href: b('/finance/receipts'),
      new: b('/finance/receipts/new'),
      detail: (id: string | number) => ({
        href: b(`/finance/receipts/${id}`),
        edit: b(`/finance/receipts/${id}/edit`),
      }),
    },
  },

  learning: b('/learning'),

  organizations: {
    href: b('/organizations'),
    join: b('/organizations/join'),
    new: b('/organizations/new'),
    detail: (id: string | number) => ({
      href: b(`/organizations/${id}`),
      edit: b(`/organizations/${id}/edit`),
    }),
  },

  portal: b('/portal'),

  projects: {
    href: b('/projects'),
    inspections: {
      href: b('/projects/inspections'),
      new: b('/projects/inspections/new'),
      detail: (id: string | number) => ({
        href: b(`/projects/inspections/${id}`),
        edit: b(`/projects/inspections/${id}/edit`),
      }),
    },
    issues: b('/projects/issues'),
    new: b('/projects/new'),
    tasks: b('/projects/tasks'),
    detail: (id: string | number) => ({
      href: b(`/projects/${id}`),
      edit: b(`/projects/${id}/edit`),
      issues: {
        href: b(`/projects/${id}/issues`),
        new: b(`/projects/${id}/issues/new`),
        detail: (issueId: string | number) => ({
          href: b(`/projects/${id}/issues/${issueId}`),
          edit: b(`/projects/${id}/issues/${issueId}/edit`),
        }),
      },
      tasks: {
        href: b(`/projects/${id}/tasks`),
        new: b(`/projects/${id}/tasks/new`),
        detail: (taskId: string | number) => ({
          href: b(`/projects/${id}/tasks/${taskId}`),
          edit: b(`/projects/${id}/tasks/${taskId}/edit`),
        }),
      },
    }),
  },

  resources: {
    href: b('/resources'),
    assets: {
      href: b('/resources/assets'),
      new: b('/resources/assets/new'),
      detail: (id: string | number) => ({
        href: b(`/resources/assets/${id}`),
        edit: b(`/resources/assets/${id}/edit`),
      }),
    },
    goodsReceipts: {
      href: b('/resources/goods-receipts'),
      new: b('/resources/goods-receipts/new'),
      detail: (id: string | number) => ({ href: b(`/resources/goods-receipts/${id}`) }),
    },
    indents: {
      href: b('/resources/indents'),
      new: b('/resources/indents/new'),
      detail: (id: string | number) => ({ href: b(`/resources/indents/${id}`) }),
    },
    materialConsumptions: {
      href: b('/resources/material-consumptions'),
      new: b('/resources/material-consumptions/new'),
      detail: (id: string | number) => ({ href: b(`/resources/material-consumptions/${id}`) }),
    },
    materials: {
      href: b('/resources/materials'),
      new: b('/resources/materials/new'),
      detail: (id: string | number) => ({
        href: b(`/resources/materials/${id}`),
        edit: b(`/resources/materials/${id}/edit`),
      }),
    },
    purchaseOrders: {
      href: b('/resources/purchase-orders'),
      new: b('/resources/purchase-orders/new'),
      detail: (id: string | number) => ({ href: b(`/resources/purchase-orders/${id}`) }),
    },
    stockAdjustments: {
      href: b('/resources/stock-adjustments'),
      new: b('/resources/stock-adjustments/new'),
      detail: (id: string | number) => ({
        href: b(`/resources/stock-adjustments/${id}`),
        edit: b(`/resources/stock-adjustments/${id}/edit`),
      }),
    },
    storageLocations: {
      href: b('/resources/storage-locations'),
      new: b('/resources/storage-locations/new'),
      detail: (id: string | number) => ({
        href: b(`/resources/storage-locations/${id}`),
        edit: b(`/resources/storage-locations/${id}/edit`),
      }),
    },
    transfers: {
      href: b('/resources/transfers'),
      new: b('/resources/transfers/new'),
      detail: (id: string | number) => ({
        href: b(`/resources/transfers/${id}`),
        edit: b(`/resources/transfers/${id}/edit`),
      }),
    },
  },

  settings: b('/settings'),

  site: b('/site'),

  tasks: b('/tasks'),

  thirdParty: {
    href: b('/third-party'),
    labour: {
      href: b('/third-party/labour'),
      new: b('/third-party/labour/new'),
      detail: (id: string | number) => ({
        href: b(`/third-party/labour/${id}`),
        edit: b(`/third-party/labour/${id}/edit`),
      }),
    },
    subContracts: {
      href: b('/third-party/sub-contracts'),
      new: b('/third-party/sub-contracts/new'),
      detail: (id: string | number) => ({
        href: b(`/third-party/sub-contracts/${id}`),
        edit: b(`/third-party/sub-contracts/${id}/edit`),
      }),
    },
    vendors: {
      href: b('/third-party/vendors'),
      new: b('/third-party/vendors/new'),
      detail: (id: string | number) => ({
        href: b(`/third-party/vendors/${id}`),
        edit: b(`/third-party/vendors/${id}/edit`),
      }),
    },
  },

  workforce: {
    href: b('/workforce'),
    employees: {
      href: b('/workforce/employees'),
      employeeManagement: {
        href: b('/workforce/employees/employee-management'),
        detail: (id: string | number) => ({
          href: b(`/workforce/employees/employee-management/${id}`),
          edit: b(`/workforce/employees/employee-management/${id}/edit`),
        }),
      },
      invitations: {
        href: b('/workforce/employees/invitations'),
        new: b('/workforce/employees/invitations/new'),
        detail: (id: string | number) => ({ href: b(`/workforce/employees/invitations/${id}`) }),
      },
    },
    leaves: {
      href: b('/workforce/leaves'),
      manage: {
        href: b('/workforce/leaves/manage'),
        balance: b('/workforce/leaves/manage/balance'),
        calendar: b('/workforce/leaves/manage/calendar'),
        policies: b('/workforce/leaves/manage/policies'),
        requests: {
          href: b('/workforce/leaves/manage/requests'),
          new: b('/workforce/leaves/manage/requests/new'),
          detail: (id: string | number) => ({ href: b(`/workforce/leaves/manage/requests/${id}`) }),
        },
      },
    },
  },
} as const;

export type Routes = typeof routes;
