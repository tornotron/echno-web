import {
  Wallet,
  ReceiptText,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  TrendingDown,
  PiggyBank,
  FolderTree,
  Tags,
  Settings,
  BookOpen,
  Banknote,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const financeMetadata = {
  finance: {
    label: 'Finance',
    icon: Wallet,
    nonInteractive: true,
    section: 'operations',
    order: 7,
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

  // ── customer invoices (accounts receivable) ────────────────────────────────
  'finance-customer-invoices': {
    label: 'Customer Invoices',
    icon: ReceiptText,
    description:
      'Issue and cancel the receivables raised to a customer, and see what is still owed.',
    order: 4,
  },

  // ── payables (accounts payable) ───────────────────────────────────────────
  'finance-payables': {
    label: 'Payables',
    icon: Banknote,
    description:
      'Track what is owed to contractors and vendors, and record payments against it.',
    order: 5,
  },

  // ── expenses ──────────────────────────────────────────────────────────────
  'finance-expenses': {
    label: 'Expenses',
    icon: TrendingDown,
    description: 'Log day-to-day site and operational expenses.',
    order: 6,
  },
  'finance-expenses-new': { label: 'New Expense', sidebarHidden: true },
  'finance-expenses-[id]': { label: 'Expense', sidebarHidden: true },
  'finance-expenses-[id]-edit': { label: 'Edit', sidebarHidden: true },

  // ── budgets ───────────────────────────────────────────────────────────────
  'finance-budgets': {
    label: 'Budgets',
    icon: PiggyBank,
    description: 'Per-project budget allocation and spend across the organization.',
    order: 7,
  },

  // ── chart of accounts ───────────────────────────────────────────────────────
  'finance-chart-of-accounts': {
    label: 'Chart of Accounts',
    icon: FolderTree,
    description:
      'Maintain ledger accounts and import or export the chart as CSV.',
    order: 8,
  },

  // ── journal entries ─────────────────────────────────────────────────────────
  'finance-journal-entries': {
    label: 'Journal Entries',
    icon: BookOpen,
    description:
      'Review ledger postings and reverse an entry that was posted in error.',
    order: 9,
  },

  // ── cost categories ─────────────────────────────────────────────────────────
  'finance-cost-categories': {
    label: 'Cost Categories',
    icon: Tags,
    description: 'Define the budget heads used to allocate and tag costs.',
    order: 10,
  },

  // ── finance settings ────────────────────────────────────────────────────────
  'finance-settings': {
    label: 'Finance Settings',
    icon: Settings,
    description:
      'Configure ledger posting accounts and the invoice approval threshold.',
    order: 11,
  },
} satisfies MetadataRegistry;
