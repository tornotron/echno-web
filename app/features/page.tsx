'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Users,
  Lock,
  Building2,
  ClipboardList,
  CalendarCheck,
  ArrowRight,
  HardHat,
  CheckCircle2,
  UserPlus,
  BarChart2,
} from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Attendance & Time Tracking',
    description:
      'Track workforce attendance across all your construction sites in real-time. QR-code check-ins, GPS verification, and automated timesheets eliminate manual tracking errors.',
    details: [
      'QR-code based check-in/check-out',
      'Real-time attendance dashboards',
      'Automated timesheet generation',
      'Multi-site attendance monitoring',
    ],
  },
  {
    icon: Users,
    title: 'Workforce Management',
    description:
      'Manage your entire workforce from a single platform. Handle employee profiles, departments, reporting hierarchies, and role assignments with ease.',
    details: [
      'Employee profiles and directories',
      'Department and team management',
      'Reporting hierarchy configuration',
      'Manager assignment and delegation',
    ],
  },
  {
    icon: ClipboardList,
    title: 'Project & Task Tracking',
    description:
      'Break down construction projects into manageable tasks. Assign teams, set deadlines, track progress, and ensure every project stays on schedule.',
    details: [
      'Project creation and organization',
      'Task assignment and tracking',
      'Progress status updates',
      'Deadline and milestone management',
    ],
  },
  {
    icon: Lock,
    title: 'Role-Based Access Control',
    description:
      'Enterprise-grade security with granular permissions. Define exactly what each role can see and do — from site engineers to project managers to company admins.',
    details: [
      'Fine-grained permission system',
      'Custom role definitions',
      'Organization-level access policies',
      'Keycloak SSO integration',
    ],
  },
  {
    icon: Building2,
    title: 'Multi-Organization Support',
    description:
      'Run multiple companies, subsidiaries, or project entities under a single account. Each organization maintains isolated data, teams, and permission boundaries.',
    details: [
      'Multiple organizations per account',
      'Isolated data and permissions',
      'Organization-level configurations',
      'Cross-organization user management',
    ],
  },
  {
    icon: CalendarCheck,
    title: 'Leave Management',
    description:
      'Streamline leave requests and approvals with configurable policies. Employees can apply for leave, managers can approve, and HR can track balances — all in one place.',
    details: [
      'Leave request and approval workflow',
      'Configurable leave policies',
      'Balance tracking and reporting',
      'Calendar view for team availability',
    ],
  },
  {
    icon: UserPlus,
    title: 'Invitations & Onboarding',
    description:
      'Invite team members to your organization with role-based invitation links and QR codes. Streamline the onboarding process for new hires across all sites.',
    details: [
      'Email and QR-code invitations',
      'Role-based invitation templates',
      'Bulk invitation support',
      'Onboarding status tracking',
    ],
  },
  {
    icon: BarChart2,
    title: 'Dashboards & Reporting',
    description:
      "Get a bird's-eye view of your entire operation. Customizable dashboards surface the metrics that matter — attendance rates, project progress, and team performance.",
    details: [
      'Organization-level dashboards',
      'Project progress overviews',
      'Workforce analytics',
      'Exportable reports',
    ],
  },
];

export default function FeaturesPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500 dark:border-amber-500"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="Features" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
            <HardHat className="mr-2 h-4 w-4" />
            Platform Features
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            Tools Built for the
            <span className="block text-indigo-600 dark:text-amber-500">
              Construction Site
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
            Every feature in Echno is designed around the real challenges of
            managing construction teams, projects, and operations.
          </p>
        </div>
      </section>

      {/* Features — Alternating Layout */}
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isEven = index % 2 === 0;
        const isDark = index % 2 === 0;

        return (
          <section
            key={feature.title}
            className={`px-4 py-20 ${isDark ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50 dark:bg-zinc-900'}`}
          >
            {/* Blueprint-style separator line */}
            {index > 0 && (
              <div className="mx-auto mb-16 max-w-7xl">
                <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent dark:via-amber-500/20"></div>
              </div>
            )}

            <div className="mx-auto max-w-7xl">
              <div
                className={`grid items-center gap-12 lg:grid-cols-2 ${
                  isEven ? '' : 'lg:direction-rtl'
                }`}
              >
                {/* Text Content */}
                <div className={isEven ? '' : 'lg:order-2'}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                    <Icon className="h-7 w-7 text-indigo-600 dark:text-amber-500" />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {feature.title}
                  </h2>
                  <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center text-zinc-700 dark:text-zinc-300"
                      >
                        <CheckCircle2 className="mr-3 h-5 w-5 shrink-0 text-indigo-600 dark:text-amber-500" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Placeholder */}
                <div className={isEven ? '' : 'lg:order-1'}>
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div
                      className="pointer-events-none absolute inset-0 dark:opacity-40"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(161,161,170,0.12) 29px, rgba(161,161,170,0.12) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(161,161,170,0.12) 29px, rgba(161,161,170,0.12) 30px)',
                      }}
                    />
                    <Icon className="h-20 w-20 text-indigo-500/20 dark:text-amber-500/20" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Why Echno? */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Why Echno?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Built by a team that understands construction. We&apos;re not
            another generic project management tool — Echno is designed from the
            ground up for the way construction businesses actually work.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 text-3xl font-black text-indigo-600 dark:text-amber-500">
                IITM
              </div>
              <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                Alumni Founded
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Built by IIT Madras graduates who understand technology and
                industry challenges.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 text-3xl font-black text-indigo-600 dark:text-amber-500">
                100%
              </div>
              <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                Construction Focused
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Every feature is designed around construction workflows, not
                adapted from generic tools.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 text-3xl font-black text-indigo-600 dark:text-amber-500">
                India
              </div>
              <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                Made for Indian Teams
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Designed for the way Indian construction companies operate, with
                local support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Ready to See These Features in Action?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Get early access to Echno and experience construction management the
            way it should be.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/plans">
              <Button
                size="lg"
                className="bg-indigo-600 px-8 text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-300 bg-transparent px-8 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
