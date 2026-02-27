'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/styles/toast-styles';
import {
  Clock,
  Users,
  Lock,
  HardHat,
  ClipboardList,
  ArrowRight,
  Building2,
  CalendarCheck,
} from 'lucide-react';

function HomeContent() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.location.search);

      const hasErrorParam = params.has('error');
      if (hasErrorParam && status === 'authenticated') {
        return;
      }

      if (status === 'authenticated' && !hasErrorParam) {
        router.push('/users/dashboard');
      }
    }
  }, [status, router]);

  useEffect(() => {
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.location.search);

      if (params.get('logout') === 'success') {
        toast.success('Signed out successfully', {
          description: 'You have been logged out.',
        });
        router.replace('/', { scroll: false });
      }

      const errorParam = params.get('error');
      if (errorParam) {
        switch (errorParam) {
          case 'logout_failed': {
            toast.error('Logout error', {
              description:
                'There was an issue signing you out. Please try again.',
            });
            break;
          }
          case 'session_invalid': {
            toast.warning('Session invalid', {
              description: 'Your session was invalid and has been cleared.',
            });
            break;
          }
          case 'session_expired':
          case 'SessionExpired': {
            toast.warning('Session expired', {
              description: 'Your session has expired. Please sign in again.',
            });
            break;
          }
          case 'session_revoked': {
            toast.warning('Session revoked', {
              description: 'Your session was terminated. Please sign in again.',
            });
            break;
          }
          default: {
            toast.info('Notice', {
              description: 'You have been signed out.',
            });
          }
        }
        router.replace('/', { scroll: false });
      }
    }
  }, [router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-amber-500"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="Home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div
          className="pointer-events-none absolute inset-0 dark:opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(161,161,170,0.15) 59px, rgba(161,161,170,0.15) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(161,161,170,0.15) 59px, rgba(161,161,170,0.15) 60px)',
          }}
        />
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
                <HardHat className="mr-2 h-4 w-4" />
                Built for Construction Teams
              </div>

              <h1 className="mb-6 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
                Manage Your
                <span className="block text-indigo-600 dark:text-amber-500">
                  Construction Business
                </span>
                Like Never Before
              </h1>

              <p className="mb-8 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                From workforce management to project tracking, Echno gives
                construction teams the tools to stay organized, efficient, and
                on schedule.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/pkans">
                  <Button
                    size="lg"
                    className="bg-indigo-600 px-8 py-3 text-lg text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                  >
                    Get Early Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-zinc-300 bg-transparent px-8 py-3 text-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  onClick={() => router.push('/features')}
                >
                  Explore Features
                </Button>
              </div>
            </div>

            {/* Hero Visual — Dashboard Preview */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-indigo-50 p-2 dark:bg-amber-500/10">
                        <HardHat className="h-5 w-5 text-indigo-600 dark:text-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Active Projects
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      12
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-indigo-50 p-2 dark:bg-amber-500/10">
                        <Users className="h-5 w-5 text-indigo-600 dark:text-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Team Members
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      48
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-indigo-50 p-2 dark:bg-amber-500/10">
                        <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Tasks Today
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      27
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-green-50 p-2 dark:bg-green-500/10">
                        <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Attendance
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      94%
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-indigo-200/30 blur-3xl dark:bg-amber-500/10"></div>
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-300/20 blur-3xl dark:bg-orange-500/10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-zinc-200 bg-zinc-50 py-10 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-center text-sm font-medium tracking-wider text-zinc-500 uppercase">
            Powering construction teams across India
          </p>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
              Everything Your Site Needs
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Purpose-built tools for construction teams — from attendance to
              project delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large card — spans 2 cols */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <Clock className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Attendance & Time Tracking
              </h3>
              <p className="max-w-lg text-zinc-600 dark:text-zinc-400">
                Track workforce attendance across all your sites in real-time.
                QR-code check-ins, GPS verification, and automated timesheets
                keep your records accurate.
              </p>
            </div>

            {/* Regular card */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <Users className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Workforce Management
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Manage employees, roles, departments, and reporting hierarchies
                from a single dashboard.
              </p>
            </div>

            {/* Regular card */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <Building2 className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Multi-Organization Support
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Run multiple companies or project entities under one account
                with isolated data and permissions.
              </p>
            </div>

            {/* Large card — spans 2 cols */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <Lock className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Role-Based Access Control
              </h3>
              <p className="max-w-lg text-zinc-600 dark:text-zinc-400">
                Enterprise-grade security with fine-grained permissions. Control
                exactly who sees what — from site engineers to project managers
                to company admins.
              </p>
            </div>

            {/* Regular card */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Project & Task Tracking
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Break projects into tasks, assign teams, and track progress with
                clear status updates and deadlines.
              </p>
            </div>

            {/* Regular card */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <CalendarCheck className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Leave Management
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Handle leave requests, approvals, and balance tracking with
                configurable policies for your organization.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-300 bg-transparent px-8 py-3 text-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                View All Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="border-y border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-black text-indigo-600 dark:text-amber-500">
                IITM
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Alumni Founded
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-black text-indigo-600 dark:text-amber-500">
                2026
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                MVP Launched
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-black text-indigo-600 dark:text-amber-500">
                99.9%
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Platform Uptime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-24">
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(79,70,229,0.1) 59px, rgba(79,70,229,0.1) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(79,70,229,0.1) 59px, rgba(79,70,229,0.1) 60px)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-40 dark:block"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(245,158,11,0.12) 59px, rgba(245,158,11,0.12) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(245,158,11,0.12) 59px, rgba(245,158,11,0.12) 60px)',
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Ready to Modernize Your Construction Operations?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Join construction teams who are building smarter with Echno. Get
            early access today.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/plans">
              <Button
                size="lg"
                className="bg-indigo-600 px-8 py-3 text-lg text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-300 bg-transparent px-8 py-3 text-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={() => router.push('/contact')}
            >
              Talk to Us
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-amber-500"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
