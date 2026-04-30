'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RegistrationForm } from '@/features/auth/registration-form';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';

const HIGHLIGHTS = [
  {
    icon: Clock,
    label: 'Attendance Tracking',
    desc: 'GPS-verified check-ins across every site',
  },
  {
    icon: Users,
    label: 'Team Management',
    desc: 'Roles, hierarchies, and shift scheduling',
  },
  {
    icon: Building2,
    label: 'Multi-Site Support',
    desc: 'Manage all projects from one dashboard',
  },
  {
    icon: BarChart3,
    label: 'Live Analytics',
    desc: 'Real-time reports and custom dashboards',
  },
];

export default function RegisterPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500" />
      </div>
    );
  }

  if (status === 'authenticated') return null;

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel — dark brand ───────────────────────────────── */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden bg-zinc-950 p-12 lg:flex lg:flex-col lg:justify-between">
        {/* Blueprint grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.7) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />

        {/* Amber glow */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #f59e0b, transparent 70%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #ea580c, transparent 70%)',
          }}
          aria-hidden
        />

        {/* Logo */}
        <div className="relative">
          <Link href="/">
            <Image
              src="/e-ai-logo.png"
              alt="Echno"
              width={110}
              height={40}
              className="invert"
            />
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative space-y-8">
          {/* Badge */}
          <Badge
            variant="outline"
            className="gap-2 border-amber-500/25 bg-amber-500/8 px-3 py-1.5 text-amber-400"
          >
            <Zap className="h-3.5 w-3.5" />
            Construction-first platform
          </Badge>

          {/* Headline */}
          <div>
            <h1 className="text-4xl leading-tight font-black tracking-tight text-white">
              Build Smarter,
              <br />
              <span
                className="text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                Manage Better.
              </span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-400">
              One platform for attendance, workforce, projects, inventory, and
              billing — built for the construction industry.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust line */}
        <div className="relative flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-zinc-600" />
          <p className="text-xs text-zinc-600">
            Enterprise-grade security · GDPR compliant · 99.9% uptime SLA
          </p>
        </div>
      </div>

      {/* ── Right panel — registration form ──────────────────────── */}
      <div className="flex w-full flex-col justify-center bg-stone-50 px-6 py-10 lg:px-16 dark:bg-zinc-950">
        {/* Mobile logo */}
        <div className="mb-8 flex justify-center lg:hidden">
          <Link href="/">
            <Image
              src="/e-ai-logo.png"
              alt="Echno"
              width={100}
              height={36}
              className="dark:invert"
            />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Fill in your details to get started — it only takes a minute.
            </p>
          </div>

          {/* Form card */}
          <Card variant="form" className="p-6 shadow-sm">
            <RegistrationForm />
          </Card>

          {/* Plans CTA */}
          <p className="mt-5 text-center text-xs text-zinc-500">
            Looking for team onboarding?{' '}
            <Link
              href="/plans"
              className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-500"
            >
              View our plans →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
