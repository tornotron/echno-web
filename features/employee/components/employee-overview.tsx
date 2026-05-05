'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Users, Mail, ChevronRight } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/shadcn/avatar';
import { Card } from '@/components/shadcn/card';
import { Employee, EmployeeStatus } from '@/types/employee';
import { cn } from '@/lib/utils/index';

interface EmployeeOverviewProps {
  employees: Employee[];
}

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-indigo-500',
];

function avatarColor(name: string) {
  const hash = [...name].reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const QUICK_ACTIONS = [
  {
    icon: Mail,
    label: 'View Invitations',
    href: '/users/dashboard/workforce/employees/invitations',
  },
  {
    icon: Users,
    label: 'View Employees',
    href: '/users/dashboard/workforce/employees/employee-management',
  },
];

export function EmployeeOverview({ employees }: EmployeeOverviewProps) {
  const total = employees.length;
  const activeCount = useMemo(
    () => employees.filter((e) => e.status === EmployeeStatus.active).length,
    [employees]
  );
  const pct = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (pct / 100) * circumference;

  const recentlyJoined = useMemo(
    () =>
      [...employees]
        .filter((e) => e.joiningDate)
        .toSorted(
          (a, b) =>
            new Date(b.joiningDate!).getTime() -
            new Date(a.joiningDate!).getTime()
        )
        .slice(0, 3),
    [employees]
  );

  return (
    <Card className="gap-0 p-6">
      <div className="divide-border grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* Donut chart */}
        <div className="flex items-center justify-center gap-4 py-6 sm:py-0 sm:pr-8">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <defs>
              <linearGradient
                id="empDonutGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/25"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#empDonutGrad)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="48"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="700"
              fill="currentColor"
            >
              {pct}%
            </text>
          </svg>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {activeCount} of {total}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Employees Active
            </p>
          </div>
        </div>

        {/* Recently Joined */}
        <div className="py-6 sm:px-8 sm:py-0">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Recruits
          </p>
          {recentlyJoined.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No recent joins
            </p>
          ) : (
            <div className="space-y-3">
              {recentlyJoined.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2.5">
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage
                      src={emp.profilePicture?.file}
                      alt={emp.name}
                    />
                    <AvatarFallback
                      className={cn(
                        'text-[10px] font-semibold text-white',
                        avatarColor(emp.name)
                      )}
                    >
                      {initials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {emp.name}
                  </span>
                  <span className="text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {formatDate(emp.joiningDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="py-6 sm:py-0 sm:pl-8">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Actions
          </p>
          <div className="space-y-1">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group hover:bg-muted/60 flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors"
              >
                <action.icon className="size-4 shrink-0 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {action.label}
                </span>
                <ChevronRight className="size-3.5 text-zinc-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
