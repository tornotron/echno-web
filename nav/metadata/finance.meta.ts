import {
  Wallet,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  TrendingDown,
  PiggyBank,
  FolderTree,
  Tags,
  Settings,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const financeMetadata = {
  finance: {
    label: 'Finance',
    icon: Wallet,
    nonInteractive: true,
    order: 6,
  },

  // ── receipts ──────────────────────────────────────────────────────────────
  'finance-receipts': {
    label: 'Receipts',
    icon: Receipt,
    description: 'Record and track money received against invoices.',
    order: 1,
  },
  'finance-receipts-new': { label: 'New Receipt', sidebarHidden: true },
  'finance-receipts-[id]': { label: 'Receipt', sidebarHidden: true },
  'finance-receipts-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── payments ──────────────────────────────────────────────────────────────
  'finance-payments': {
    label: 'Payments',
    icon: CreditCard,
    description: 'Record payments made to vendors and settle invoices.',
    order: 2,
  },
  'finance-payments-new': { label: 'New Payment', sidebarHidden: true },
  'finance-payments-[id]': { label: 'Payment', sidebarHidden: true },
  'finance-payments-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── invoices ──────────────────────────────────────────────────────────────
  'finance-invoices': {
    label: 'Invoices',
    icon: FileSpreadsheet,
    description: 'Raise and track vendor invoices and outstanding balances.',
    order: 3,
  },
  'finance-invoices-new': { label: 'New Invoice', sidebarHidden: true },
  'finance-invoices-[id]': { label: 'Invoice', sidebarHidden: true },
  'finance-invoices-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── expenses ──────────────────────────────────────────────────────────────
  'finance-expenses': {
    label: 'Expenses',
    icon: TrendingDown,
    description: 'Log day-to-day site and operational expenses.',
    order: 4,
  },
  'finance-expenses-new': { label: 'New Expense', sidebarHidden: true },
  'finance-expenses-[id]': { label: 'Expense', sidebarHidden: true },
  'finance-expenses-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── budgets ───────────────────────────────────────────────────────────────
  'finance-budgets': {
    label: 'Budgets',
    icon: PiggyBank,
    description: 'Plan project budgets and monitor spend against them.',
    order: 5,
  },
  'finance-budgets-new': { label: 'New Budget', sidebarHidden: true },
  'finance-budgets-[id]': { label: 'Budget', sidebarHidden: true },
  'finance-budgets-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── chart of accounts ───────────────────────────────────────────────────────
  'finance-chart-of-accounts': {
    label: 'Chart of Accounts',
    icon: FolderTree,
    description:
      'Maintain ledger accounts and import or export the chart as CSV.',
    order: 6,
  },

  // ── cost categories ─────────────────────────────────────────────────────────
  'finance-cost-categories': {
    label: 'Cost Categories',
    icon: Tags,
    description: 'Define the budget heads used to allocate and tag costs.',
    order: 7,
  },

  // ── finance settings ────────────────────────────────────────────────────────
  'finance-settings': {
    label: 'Finance Settings',
    icon: Settings,
    description:
      'Configure ledger posting accounts and the invoice approval threshold.',
    order: 8,
  },
} satisfies MetadataRegistry;
