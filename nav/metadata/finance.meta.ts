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
    order: 1,
  },
  'finance-receipts-new': { label: 'New Receipt', sidebarHidden: true },
  'finance-receipts-[id]': { label: 'Receipt', sidebarHidden: true },
  'finance-receipts-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── payments ──────────────────────────────────────────────────────────────
  'finance-payments': {
    label: 'Payments',
    icon: CreditCard,
    order: 2,
  },
  'finance-payments-new': { label: 'New Payment', sidebarHidden: true },
  'finance-payments-[id]': { label: 'Payment', sidebarHidden: true },
  'finance-payments-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── invoices ──────────────────────────────────────────────────────────────
  'finance-invoices': {
    label: 'Invoices',
    icon: FileSpreadsheet,
    order: 3,
  },
  'finance-invoices-new': { label: 'New Invoice', sidebarHidden: true },
  'finance-invoices-[id]': { label: 'Invoice', sidebarHidden: true },
  'finance-invoices-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── expenses ──────────────────────────────────────────────────────────────
  'finance-expenses': {
    label: 'Expenses',
    icon: TrendingDown,
    order: 4,
  },
  'finance-expenses-new': { label: 'New Expense', sidebarHidden: true },
  'finance-expenses-[id]': { label: 'Expense', sidebarHidden: true },
  'finance-expenses-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── budgets ───────────────────────────────────────────────────────────────
  'finance-budgets': {
    label: 'Budgets',
    icon: PiggyBank,
    order: 5,
  },
  'finance-budgets-new': { label: 'New Budget', sidebarHidden: true },
  'finance-budgets-[id]': { label: 'Budget', sidebarHidden: true },
  'finance-budgets-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── chart of accounts ───────────────────────────────────────────────────────
  'finance-chart-of-accounts': {
    label: 'Chart of Accounts',
    icon: FolderTree,
    order: 6,
  },

  // ── cost categories ─────────────────────────────────────────────────────────
  'finance-cost-categories': {
    label: 'Cost Categories',
    icon: Tags,
    order: 7,
  },

  // ── finance settings ────────────────────────────────────────────────────────
  'finance-settings': {
    label: 'Finance Settings',
    icon: Settings,
    order: 8,
  },
} satisfies MetadataRegistry;
