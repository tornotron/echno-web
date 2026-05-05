'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { Card, CardTitle, CardDescription } from '@/components/shadcn/card';
import { Dialog, DialogContent, DialogClose } from '@/components/shadcn/dialog';
import {
  Clock,
  Users,
  Lock,
  Building2,
  ClipboardList,
  CalendarCheck,
  UserPlus,
  BarChart2,
  Package,
  CreditCard,
  MessageSquare,
  FileText,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   FEATURE DATA
══════════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Clock,
    accent: '#f59e0b',
    category: 'Field Ops',
    title: 'Attendance & Time Tracking',
    tagline: "Know who's on site, right now.",
    description:
      'Track workforce attendance across all construction sites in real-time. QR-code check-ins, GPS verification, and automated timesheets eliminate manual tracking errors and payroll disputes.',
    details: [
      'QR-code based check-in/check-out',
      'GPS-verified location logging',
      'Automated timesheet generation',
      'Multi-site attendance monitoring',
    ],
    mockType: 'attendance',
  },
  {
    icon: Users,
    accent: '#38bdf8',
    category: 'Field Ops',
    title: 'Workforce Management',
    tagline: 'Every worker, every role, one view.',
    description:
      'Manage your entire workforce from a single platform. Handle employee profiles, departments, reporting hierarchies, and role assignments at any scale.',
    details: [
      'Employee profiles and directories',
      'Department and team management',
      'Reporting hierarchy configuration',
      'Manager assignment and delegation',
    ],
    mockType: 'workforce',
  },
  {
    icon: ClipboardList,
    accent: '#a78bfa',
    category: 'Projects',
    title: 'Project & Task Tracking',
    tagline: 'From blueprint to completion.',
    description:
      'Break construction projects into managed tasks. Assign teams, set milestones, track dependencies, and ensure every phase stays on schedule with real-time status.',
    details: [
      'Project creation and work packages',
      'Task assignment and tracking',
      'Milestone and deadline management',
      'Issue and punch list tracking',
    ],
    mockType: 'kanban',
  },
  {
    icon: Package,
    accent: '#34d399',
    category: 'Field Ops',
    title: 'Materials & Inventory',
    tagline: 'No more surprise shortages.',
    description:
      'Track stock levels across all sites, issue materials to work orders, log deliveries, and get low-stock alerts before shortages stall your progress.',
    details: [
      'Real-time stock visibility per site',
      'Material issuance to work orders',
      'Delivery and receipt management',
      'Low-stock alerts and reorder triggers',
    ],
    mockType: 'inventory',
  },
  {
    icon: FileText,
    accent: '#fb923c',
    category: 'Projects',
    title: 'Daily Reports & Inspections',
    tagline: 'Paperwork done in minutes, not hours.',
    description:
      'Standardised daily progress reports, quality inspections, safety audits, and punch lists — fully digital, photo-attached, searchable, and legally auditable.',
    details: [
      'Daily site progress reports',
      'Quality & safety inspections',
      'Issue tracking and punch lists',
      'Photo and document attachments',
    ],
    mockType: 'checklist',
  },
  {
    icon: CreditCard,
    accent: '#f472b6',
    category: 'Finance',
    title: 'Billing & Payments',
    tagline: 'Every rupee tracked and reconciled.',
    description:
      'Generate invoices, track payment milestones, manage contractor bills, and reconcile budgets with a live expense feed across every project simultaneously.',
    details: [
      'Invoice generation and tracking',
      'Payment milestone management',
      'Contractor bill processing',
      'Live budget vs. actuals',
    ],
    mockType: 'billing',
  },
  {
    icon: Lock,
    accent: '#facc15',
    category: 'Management',
    title: 'Role-Based Access Control',
    tagline: 'Right access for the right people.',
    description:
      'Enterprise-grade security with granular permissions. Define exactly what each role can see and do — from site engineers to project managers to company owners.',
    details: [
      'Fine-grained permission system',
      'Custom role definitions',
      'Organization-level access policies',
      'Keycloak SSO integration',
    ],
    mockType: 'permissions',
  },
  {
    icon: Building2,
    accent: '#f59e0b',
    category: 'Management',
    title: 'Multi-Organization Support',
    tagline: 'Scale across entities without the chaos.',
    description:
      'Run multiple companies, subsidiaries, or project entities under one account. Each organization maintains isolated data, teams, and permission boundaries.',
    details: [
      'Multiple organizations per account',
      'Isolated data and permissions',
      'Organization-level configurations',
      'Cross-organization user management',
    ],
    mockType: 'orgtree',
  },
  {
    icon: CalendarCheck,
    accent: '#38bdf8',
    category: 'Management',
    title: 'Leave Management',
    tagline: 'Approvals in seconds, not days.',
    description:
      'Streamline leave requests and approvals with configurable policies. Employees apply, managers approve, and HR tracks balances — in one seamless workflow.',
    details: [
      'Leave request and approval workflow',
      'Configurable leave policies',
      'Balance tracking and carryover',
      'Calendar view for team availability',
    ],
    mockType: 'calendar',
  },
  {
    icon: MessageSquare,
    accent: '#a78bfa',
    category: 'Field Ops',
    title: 'Team Communication',
    tagline: 'Context where the work happens.',
    description:
      'Project-scoped chat, announcements, and document sharing. Keep conversations tied to the project, not scattered across WhatsApp threads.',
    details: [
      'Project-scoped chat rooms',
      'Organisation-wide announcements',
      'Document and photo sharing',
      'Searchable message history',
    ],
    mockType: 'chat',
  },
  {
    icon: UserPlus,
    accent: '#34d399',
    category: 'Management',
    title: 'Invitations & Onboarding',
    tagline: 'New hire ready in under 5 minutes.',
    description:
      'Invite team members with role-based invitation links and QR codes. Streamline onboarding for new hires and contractors across all sites instantly.',
    details: [
      'Email and QR-code invitations',
      'Role-based invitation templates',
      'Bulk invitation support',
      'Onboarding status tracking',
    ],
    mockType: 'invite',
  },
  {
    icon: BarChart2,
    accent: '#fb923c',
    category: 'Finance',
    title: 'Analytics Dashboard',
    tagline: 'See everything. Decide faster.',
    description:
      'Customizable dashboards surface the metrics that matter most — KPIs, earned value, cost trends, and workforce productivity across all active projects.',
    details: [
      'Organization-level KPI dashboards',
      'Project progress overviews',
      'Workforce analytics and heatmaps',
      'Exportable PDF and CSV reports',
    ],
    mockType: 'analytics',
  },
] as const;

type MockType = (typeof FEATURES)[number]['mockType'];
type Feature = (typeof FEATURES)[number];

/* ══════════════════════════════════════════════════════════════════════
   MOCK UI COMPONENTS
══════════════════════════════════════════════════════════════════════ */

function MockShell({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-white/6 dark:bg-zinc-950">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-stone-100 bg-stone-50 px-4 dark:border-white/5 dark:bg-zinc-900">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        <div className="ml-3 h-4 w-32 rounded bg-stone-200 dark:bg-zinc-700" />
      </div>
      <div className="flex-1 overflow-hidden p-4">{children}</div>
      <div
        className="h-0.5 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
        }}
      />
    </div>
  );
}

function AttendanceMock({ accent }: { accent: string }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S'];
  const rows = [
    [1, 1, 1, 1, 1, 0],
    [1, 0, 1, 1, 1, 1],
    [1, 1, 1, 0, 1, 0],
    [1, 1, 1, 1, 0, 0],
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Attendance — Week 18
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${accent}15`, color: accent }}
        >
          94% present
        </span>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        <span className="text-[9px] text-zinc-400">Worker</span>
        {days.map((d, i) => (
          <span key={i} className="text-[9px] font-bold text-zinc-500">
            {d}
          </span>
        ))}
      </div>
      {['Rajan K.', 'Priya S.', 'Mohan R.', 'Deepa V.'].map((name, ri) => (
        <div key={name} className="mb-1.5 grid grid-cols-7 items-center gap-1">
          <span className="truncate text-[9px] text-zinc-500">{name}</span>
          {rows[ri].map((present, ci) => (
            <div
              key={ci}
              className="mx-auto h-4 w-4 rounded-full"
              style={{
                background: present ? `${accent}30` : '#f3f4f6',
                border: `1.5px solid ${present ? accent : '#e5e7eb'}`,
              }}
            >
              {present === 1 && (
                <div
                  className="m-auto mt-[3px] h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <div className="mt-3 flex gap-2">
        {[
          { l: 'On Site', v: '47', c: accent },
          { l: 'On Leave', v: '3', c: '#94a3b8' },
          { l: 'Absent', v: '2', c: '#f87171' },
        ].map((s) => (
          <div
            key={s.l}
            className="flex-1 rounded-lg p-2 text-center"
            style={{ background: `${s.c}10` }}
          >
            <div className="text-sm font-black" style={{ color: s.c }}>
              {s.v}
            </div>
            <div className="text-[9px] text-zinc-500">{s.l}</div>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function WorkforceMock({ accent }: { accent: string }) {
  const workers = [
    { name: 'Arun K.', role: 'Site Engineer', dept: 'Civil', active: true },
    { name: 'Priya M.', role: 'Supervisor', dept: 'MEP', active: true },
    { name: 'Suresh R.', role: 'Foreman', dept: 'Civil', active: false },
    { name: 'Deepa V.', role: 'QC Inspector', dept: 'QA', active: true },
    { name: 'Mohan P.', role: 'Safety Officer', dept: 'HSE', active: true },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Workforce Directory
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${accent}15`, color: accent }}
        >
          52 members
        </span>
      </div>
      <div className="space-y-1.5">
        {workers.map((w) => (
          <div
            key={w.name}
            className="flex items-center gap-2.5 rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2 dark:border-white/4 dark:bg-zinc-900"
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
              style={{ background: `${accent}18`, color: accent }}
            >
              {w.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                {w.name}
              </div>
              <div className="text-[9px] text-zinc-500">
                {w.role} · {w.dept}
              </div>
            </div>
            <div
              className={`h-1.5 w-1.5 rounded-full ${w.active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
            />
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function KanbanMock({ accent }: { accent: string }) {
  const cols = [
    {
      label: 'To Do',
      color: '#94a3b8',
      tasks: ['Foundation inspection', 'Rebar delivery'],
    },
    {
      label: 'In Progress',
      color: accent,
      tasks: ['Column formwork', 'MEP rough-in', 'Plastering B2'],
    },
    { label: 'Done', color: '#34d399', tasks: ['Site clearing', 'Pile caps'] },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
        Project Tasks — Block A
      </div>
      <div className="grid h-[calc(100%-28px)] grid-cols-3 gap-2">
        {cols.map((col) => (
          <div key={col.label} className="flex flex-col gap-1.5">
            <div className="mb-1 flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: col.color }}
              />
              <span className="text-[9px] font-bold tracking-wide text-zinc-500 uppercase">
                {col.label}
              </span>
            </div>
            {col.tasks.map((t) => (
              <div
                key={t}
                className="rounded-lg border border-stone-200 bg-stone-50 p-2 dark:border-white/5 dark:bg-zinc-900"
              >
                <div className="text-[9px] leading-tight text-zinc-700 dark:text-zinc-300">
                  {t}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function InventoryMock({ accent }: { accent: string }) {
  const items = [
    { name: 'Cement (50kg bags)', stock: 847, cap: 1000, low: false },
    { name: 'TMT Rebar 12mm', stock: 120, cap: 500, low: true },
    { name: 'Hollow Blocks', stock: 3400, cap: 4000, low: false },
    { name: 'River Sand (tons)', stock: 18, cap: 100, low: true },
    { name: 'Plywood Sheets', stock: 210, cap: 300, low: false },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Site Inventory
        </span>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          2 low stock
        </span>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => {
          const pct = Math.round((item.stock / item.cap) * 100);
          return (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                  {item.name}
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: item.low ? '#f87171' : accent }}
                >
                  {item.stock.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: item.low ? '#f87171' : accent,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </MockShell>
  );
}

function ChecklistMock({ accent }: { accent: string }) {
  const items = [
    { label: 'Daily workforce headcount logged', done: true },
    { label: 'Safety briefing conducted', done: true },
    { label: 'Column formwork inspection', done: true },
    { label: 'Concrete pour — Block C slab', done: false },
    { label: 'Evening site walkthrough', done: false },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Daily Report · 24 Apr
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${accent}15`, color: accent }}
        >
          3/5 complete
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${item.done ? 'border-transparent' : 'border-stone-300 dark:border-zinc-600'}`}
              style={item.done ? { background: accent, border: 'none' } : {}}
            >
              {item.done && (
                <svg
                  className="h-2.5 w-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-[11px] ${item.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-3 dark:border-white/5 dark:bg-zinc-900">
        <div className="mb-1 text-[9px] font-bold tracking-wide text-zinc-500 uppercase">
          Notes
        </div>
        <div className="h-1.5 w-3/4 rounded bg-stone-200 dark:bg-zinc-700" />
        <div className="mt-1 h-1.5 w-1/2 rounded bg-stone-200 dark:bg-zinc-700" />
      </div>
    </MockShell>
  );
}

function BillingMock({ accent }: { accent: string }) {
  const items = [
    { desc: 'Concrete work — Slab B3', amount: '₹1,84,000' },
    { desc: 'Rebar fabrication', amount: '₹92,500' },
    { desc: 'Scaffolding rental (30d)', amount: '₹18,000' },
    { desc: 'Skilled labour — 40 days', amount: '₹2,40,000' },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Invoice #INV-0142
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Pending
        </span>
      </div>
      <div className="mb-2 grid grid-cols-[1fr_auto] gap-x-3 border-b border-stone-100 pb-2 dark:border-white/5">
        <span className="text-[9px] font-bold text-zinc-400 uppercase">
          Description
        </span>
        <span className="text-[9px] font-bold text-zinc-400 uppercase">
          Amount
        </span>
      </div>
      {items.map((item) => (
        <div
          key={item.desc}
          className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-stone-50 py-1.5 dark:border-white/3"
        >
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400">
            {item.desc}
          </span>
          <span className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200">
            {item.amount}
          </span>
        </div>
      ))}
      <div
        className="mt-2 flex items-center justify-between rounded-lg p-2"
        style={{ background: `${accent}10` }}
      >
        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
          Total
        </span>
        <span className="text-sm font-black" style={{ color: accent }}>
          ₹5,34,500
        </span>
      </div>
    </MockShell>
  );
}

function PermissionsMock({ accent }: { accent: string }) {
  const roles = ['Owner', 'PM', 'Eng.', 'Worker'];
  const perms = [
    { name: 'View Projects', access: [true, true, true, false] },
    { name: 'Edit Budget', access: [true, true, false, false] },
    { name: 'Approve Leave', access: [true, true, false, false] },
    { name: 'Mark Attendance', access: [true, false, true, true] },
    { name: 'View Reports', access: [true, true, true, false] },
    { name: 'Manage Users', access: [true, false, false, false] },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
        Permissions Matrix
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr>
              <th className="pb-2 text-left font-semibold text-zinc-400">
                Permission
              </th>
              {roles.map((r) => (
                <th
                  key={r}
                  className="pb-2 text-center font-semibold text-zinc-500"
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perms.map((p) => (
              <tr
                key={p.name}
                className="border-t border-stone-50 dark:border-white/3"
              >
                <td className="py-1.5 pr-2 font-medium text-zinc-600 dark:text-zinc-400">
                  {p.name}
                </td>
                {p.access.map((has, i) => (
                  <td key={i} className="py-1.5 text-center">
                    {has ? (
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full"
                        style={{
                          background: accent + '30',
                          border: `1.5px solid ${accent}`,
                        }}
                      >
                        <span className="flex h-full items-center justify-center">
                          <span
                            className="block h-1.5 w-1.5 rounded-full"
                            style={{ background: accent }}
                          />
                        </span>
                      </span>
                    ) : (
                      <span className="inline-block h-3.5 w-3.5 rounded-full bg-stone-100 dark:bg-zinc-800" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockShell>
  );
}

function OrgTreeMock({ accent }: { accent: string }) {
  return (
    <MockShell accent={accent}>
      <div className="mb-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
        Organizations
      </div>
      <div className="flex flex-col items-center">
        <div
          className="rounded-xl border-2 px-4 py-2 text-[10px] font-bold text-zinc-800 dark:text-zinc-100"
          style={{ borderColor: accent, background: `${accent}10` }}
        >
          Mehta Group Holdings
        </div>
        <div className="h-4 w-0.5 bg-stone-200 dark:bg-zinc-700" />
        <div className="flex gap-6">
          {['Mehta Infra', 'Mehta Homes', 'MEP Division'].map((org, i) => (
            <div key={org} className="flex flex-col items-center">
              <div className="h-4 w-0.5 bg-stone-200 dark:bg-zinc-700" />
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-[9px] font-semibold text-zinc-600 dark:border-white/6 dark:bg-zinc-900 dark:text-zinc-400">
                {org}
              </div>
              {i === 0 && (
                <>
                  <div className="h-3 w-0.5 bg-stone-200 dark:bg-zinc-700" />
                  <div className="flex gap-3">
                    {['Site A', 'Site B'].map((s) => (
                      <div key={s} className="flex flex-col items-center">
                        <div className="h-3 w-0.5 bg-stone-200 dark:bg-zinc-700" />
                        <div className="rounded border border-stone-200 bg-white px-2 py-1 text-[8px] text-zinc-500 dark:border-white/5 dark:bg-zinc-950">
                          {s}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </MockShell>
  );
}

function CalendarMock({ accent }: { accent: string }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const leaveMap: Record<number, string> = {
    8: accent,
    9: accent,
    10: accent,
    15: '#f87171',
    22: '#94a3b8',
    23: '#94a3b8',
  };
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Leave Calendar · April
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${accent}15`, color: accent }}
        >
          2 pending
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[8px] font-bold text-zinc-400"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: 1 }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {days.map((d) => {
          const color = leaveMap[d];
          return (
            <div
              key={d}
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-medium"
              style={
                color
                  ? { background: `${color}25`, color, fontWeight: 700 }
                  : { color: '#71717a' }
              }
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        {[
          { l: 'Approved', c: accent },
          { l: 'Pending', c: '#f59e0b' },
          { l: 'Rejected', c: '#f87171' },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: s.c }} />
            <span className="text-[9px] text-zinc-500">{s.l}</span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function ChatMock({ accent }: { accent: string }) {
  const messages = [
    {
      from: 'PM',
      text: 'Concrete pour scheduled for tomorrow 7am. All clear?',
      mine: false,
      time: '10:24',
    },
    {
      from: 'You',
      text: 'Confirmed. Mixer booked, team briefed.',
      mine: true,
      time: '10:31',
    },
    {
      from: 'SE',
      text: 'Formwork inspection passed. Ready to proceed.',
      mine: false,
      time: '10:45',
    },
    {
      from: 'You',
      text: 'Great. Attaching the inspection report now.',
      mine: true,
      time: '10:47',
    },
  ];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black"
          style={{ background: `${accent}20`, color: accent }}
        >
          B3
        </div>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Block C — Site Chat
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] text-zinc-500">5 online</span>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] rounded-xl px-3 py-1.5"
              style={
                m.mine
                  ? { background: `${accent}20`, borderBottomRightRadius: 4 }
                  : {}
              }
            >
              <div
                className={`rounded-xl px-0 ${m.mine ? '' : 'bg-stone-100 dark:bg-zinc-800'}`}
              >
                {!m.mine && (
                  <div className="mb-0.5 text-[8px] font-bold text-zinc-400">
                    {m.from}
                  </div>
                )}
                <div
                  className={`text-[10px] leading-relaxed ${m.mine ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-700 dark:text-zinc-300'}`}
                >
                  {m.text}
                </div>
                <div className="mt-0.5 text-right text-[8px] text-zinc-400">
                  {m.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

// Stable QR pattern — generated once at module level, not on every render
const QR_PATTERN = Array.from({ length: 25 }, () => Math.random() > 0.4);

function InviteMock({ accent }: { accent: string }) {
  return (
    <MockShell accent={accent}>
      <div className="mb-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
        Invite Team Members
      </div>
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2"
          style={{ borderColor: `${accent}40`, background: `${accent}08` }}
        >
          <div className="grid grid-cols-5 gap-0.5">
            {QR_PATTERN.map((filled, i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: filled ? `${accent}80` : 'transparent' }}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
            Scan to Join
          </div>
          <div className="mb-2 text-[9px] text-zinc-500">
            Role: Site Engineer
          </div>
          <div
            className="rounded-lg px-3 py-1 text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            Copy Link
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {['arun@site.com', 'priya@mehta.co'].map((email) => (
          <div
            key={email}
            className="flex items-center gap-2 rounded-lg border border-stone-100 bg-stone-50 px-3 py-1.5 dark:border-white/5 dark:bg-zinc-900"
          >
            <span className="flex-1 text-[10px] text-zinc-500">{email}</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Pending
            </span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function AnalyticsMock({ accent }: { accent: string }) {
  const bars = [65, 82, 71, 90, 78, 95, 88];
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  return (
    <MockShell accent={accent}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Project Efficiency
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          ↑ 12% this month
        </span>
      </div>
      <div className="mb-2 flex h-24 items-end gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${h}%`,
                background: i === bars.length - 1 ? accent : `${accent}40`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {months.map((m) => (
          <span key={m} className="text-[8px] text-zinc-400">
            {m}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: 'Avg Score', v: '84%' },
          { l: 'On-Time', v: '91%' },
          { l: 'Budget', v: '96%' },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg p-2 text-center"
            style={{ background: `${accent}08` }}
          >
            <div className="text-sm font-black" style={{ color: accent }}>
              {s.v}
            </div>
            <div className="text-[8px] text-zinc-500">{s.l}</div>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

const MOCK_MAP: Record<MockType, React.ComponentType<{ accent: string }>> = {
  attendance: AttendanceMock,
  workforce: WorkforceMock,
  kanban: KanbanMock,
  inventory: InventoryMock,
  checklist: ChecklistMock,
  billing: BillingMock,
  permissions: PermissionsMock,
  orgtree: OrgTreeMock,
  calendar: CalendarMock,
  chat: ChatMock,
  invite: InviteMock,
  analytics: AnalyticsMock,
};

/* ══════════════════════════════════════════════════════════════════════
   FEATURE DETAIL PANEL
══════════════════════════════════════════════════════════════════════ */
function FeaturePanel({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const MockComponent = MOCK_MAP[feature.mockType];
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex flex-col justify-center">
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: `${feature.accent}14`,
            border: `1.5px solid ${feature.accent}30`,
          }}
        >
          <Icon className="h-7 w-7" style={{ color: feature.accent }} />
        </div>
        <div
          className="mb-2 text-xs font-semibold tracking-[0.15em] uppercase"
          style={{ color: feature.accent }}
        >
          {feature.category}
        </div>
        <h2 className="mb-2 text-3xl font-black text-zinc-900 dark:text-white">
          {feature.title}
        </h2>
        <p className="mb-1 text-base font-semibold text-zinc-500 dark:text-zinc-400">
          {feature.tagline}
        </p>
        <p className="mb-7 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {feature.description}
        </p>
        <ul className="space-y-3">
          {feature.details.map((d) => (
            <li key={d} className="flex items-center gap-3">
              <CheckCircle2
                className="h-4 w-4 shrink-0"
                style={{ color: feature.accent }}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {d}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-[360px]">
        <MockComponent accent={feature.accent} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FEATURE CARD  (svc-grid style, theme-aware)
══════════════════════════════════════════════════════════════════════ */
function FeatureCard({
  feature,
  onClick,
}: {
  feature: Feature;
  onClick: () => void;
}) {
  const Icon = feature.icon;
  return (
    <Card
      variant="feature"
      onClick={onClick}
      className="bg-white dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      {/* Icon */}
      <div className="mb-7 h-11 w-11" style={{ color: feature.accent }}>
        <Icon className="h-full w-full" />
      </div>

      {/* Category */}
      <div
        className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] uppercase"
        style={{ color: feature.accent }}
      >
        {feature.category}
      </div>

      {/* Title */}
      <CardTitle
        className="mb-3 text-zinc-900 dark:text-zinc-100"
        style={{ letterSpacing: '-0.02em' }}
      >
        {feature.title}
      </CardTitle>

      {/* Description */}
      <CardDescription className="leading-relaxed text-zinc-500 dark:text-zinc-500">
        {feature.description.length > 110
          ? feature.description.slice(0, 110) + '…'
          : feature.description}
      </CardDescription>

      {/* "Explore →" hint */}
      <div className="mt-5 flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors duration-200 group-hover:text-amber-600 dark:text-zinc-600 dark:group-hover:text-amber-500">
        <span>Explore</span>
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </div>

      {/* Bottom glow line */}
      <div
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)`,
        }}
      />
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FEATURE MODAL
══════════════════════════════════════════════════════════════════════ */
function FeatureModal({
  feature,
  onClose,
}: {
  feature: Feature;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="xl"
        animation="slide-up"
        overlayBlur="xl"
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto rounded-2xl border-stone-200 bg-white p-0 shadow-2xl dark:border-white/8 dark:bg-zinc-900"
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 right-0 left-0 h-0.5 rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, ${feature.accent}, #ea580c)`,
          }}
        />

        {/* Close button */}
        <DialogClose className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-zinc-400 transition-colors hover:border-stone-300 hover:text-zinc-600 dark:border-white/10 dark:text-zinc-500 dark:hover:border-white/20 dark:hover:text-zinc-300">
          <X className="h-4 w-4" />
        </DialogClose>

        {/* Content */}
        <div className="p-8 sm:p-12">
          <FeaturePanel feature={feature} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════ */
export default function FeaturesPage() {
  const [selected, setSelected] = useState<Feature | null>(null);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      <MarketingNav currentPage="Features" />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-36 pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,27,75,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,27,75,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-[0.03] dark:block"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 dark:border-amber-500/20 dark:bg-amber-500/6">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              What We Build
            </span>
          </div>
          <h1
            className="mb-4 text-5xl leading-tight font-black text-zinc-900 sm:text-6xl dark:text-white"
            style={{ letterSpacing: '-0.04em' }}
          >
            Our Features
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            12 modules. One platform. Everything your teams need, connected.
          </p>
        </div>
      </section>

      {/* ── Gradient divider ───────────────────────────────────────── */}
      <div
        className="h-px w-full opacity-20"
        style={{
          background:
            'linear-gradient(90deg, transparent, #f59e0b 30%, #a78bfa 70%, transparent)',
        }}
      />

      {/* ── Services grid ──────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
                Platform Capabilities
              </div>
              <h2
                className="text-4xl font-black text-zinc-900 sm:text-5xl dark:text-white"
                style={{ letterSpacing: '-0.035em', lineHeight: 1.05 }}
              >
                12 Modules.
                <br />
                Built for Construction.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500 sm:text-right dark:text-zinc-500">
              Click any module to see a full feature breakdown with a live
              preview.
            </p>
          </div>

          {/* Grid — 1px gap acts as a divider line */}
          <div
            className="grid grid-cols-1 border border-stone-200 bg-stone-100 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 dark:border-white/5 dark:bg-zinc-800"
            style={{ gap: 1 }}
          >
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.title}
                feature={f}
                onClick={() => setSelected(f)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Echno ──────────────────────────────────────────────── */}
      <section className="border-t border-stone-100 bg-stone-50 px-6 py-24 dark:border-white/4 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-2 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
            Why Echno
          </div>
          <h2 className="mb-4 text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
            Not just another PM tool.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-zinc-500">
            Purpose-built for the way construction businesses actually work —
            not adapted from generic tools.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                val: 'IITM',
                label: 'Alumni Founded',
                desc: 'Built by IIT Madras graduates who understand both tech and the construction industry.',
              },
              {
                val: '100%',
                label: 'Construction Focused',
                desc: 'Every feature is designed around construction workflows — nothing is adapted from generic tools.',
              },
              {
                val: 'India',
                label: 'Made for Indian Teams',
                desc: 'Designed for how Indian construction companies operate, with local language support on the roadmap.',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-stone-200 bg-white p-8 dark:border-white/6 dark:bg-zinc-950"
              >
                <div className="mb-2 text-3xl font-black text-amber-600 dark:text-amber-500">
                  {s.val}
                </div>
                <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                  {s.label}
                </h3>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-stone-100 bg-white px-6 py-24 dark:border-white/4 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
            Ready to see it in action?
          </h2>
          <p className="mb-8 text-zinc-500">
            Get early access and have your first project live this week.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/plans">
              <button
                className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background:
                    'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                }}
              >
                Get Early Access{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-8 py-4 text-base font-semibold text-zinc-700 transition-all duration-300 hover:border-stone-300 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300 dark:hover:bg-white/8">
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />

      {/* ── Feature Modal ───────────────────────────────────────────── */}
      {selected && (
        <FeatureModal feature={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
