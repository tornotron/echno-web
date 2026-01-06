'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Clock,
  BarChart2,
  Lock,
  Users,
  FileText,
  Globe,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Bell,
  Calendar,
  Layers,
  Settings,
  Shield,
  Zap,
  Database,
  Cloud,
  RefreshCw,
} from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Real-time Tracking',
    description:
      'Monitor attendance, project progress, and resource allocation in real-time with instant updates and notifications across all your sites.',
    color: 'blue',
    details: [
      'Live GPS tracking for field workers',
      'Instant attendance updates',
      'Real-time project status dashboards',
      'Automated alerts and notifications',
    ],
  },
  {
    icon: BarChart2,
    title: 'Advanced Analytics',
    description:
      'Generate comprehensive reports and insights to optimize workforce management, project timelines, and resource allocation.',
    color: 'green',
    details: [
      'Custom report generation',
      'Performance trend analysis',
      'Predictive project forecasting',
      'Cost analysis and optimization',
    ],
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description:
      'Enterprise-grade security with Keycloak authentication, role-based access control, and comprehensive data protection.',
    color: 'purple',
    details: [
      'SSO and multi-factor authentication',
      'Role-based access control (RBAC)',
      'Data encryption at rest and in transit',
      'Audit logs and compliance reporting',
    ],
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Effortlessly manage teams, assign tasks, and track performance across multiple project sites from a single dashboard.',
    color: 'amber',
    details: [
      'Team scheduling and shift management',
      'Skill-based task assignment',
      'Performance tracking and reviews',
      'Communication tools integration',
    ],
  },
  {
    icon: FileText,
    title: 'Document Management',
    description:
      'Centralized document storage with version control, approval workflows, and easy sharing capabilities for all project files.',
    color: 'red',
    details: [
      'Cloud-based document storage',
      'Version control and history',
      'Digital signature support',
      'Automated backup and recovery',
    ],
  },
  {
    icon: Globe,
    title: 'Multi-site Support',
    description:
      'Manage multiple construction sites from a single dashboard with location-based insights and consolidated reporting.',
    color: 'indigo',
    details: [
      'Unified multi-site dashboard',
      'Location-based analytics',
      'Cross-site resource allocation',
      'Centralized project oversight',
    ],
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description:
      'Access all features on-the-go with our responsive mobile interface designed for field workers and managers alike.',
    color: 'cyan',
    details: [
      'Native mobile applications',
      'Offline mode support',
      'Push notifications',
      'Quick clock-in/out functionality',
    ],
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Stay informed with intelligent notifications that alert you to important events, deadlines, and project milestones.',
    color: 'orange',
    details: [
      'Customizable alert preferences',
      'Priority-based notifications',
      'Escalation workflows',
      'Multi-channel delivery (email, SMS, push)',
    ],
  },
  {
    icon: Calendar,
    title: 'Project Scheduling',
    description:
      'Plan and manage project timelines with intuitive scheduling tools, Gantt charts, and milestone tracking.',
    color: 'teal',
    details: [
      'Drag-and-drop Gantt charts',
      'Milestone and deadline tracking',
      'Resource capacity planning',
      'Dependency management',
    ],
  },
  {
    icon: Layers,
    title: 'Inventory Management',
    description:
      'Track materials, equipment, and supplies across all sites with automated reorder alerts and usage analytics.',
    color: 'pink',
    details: [
      'Real-time inventory tracking',
      'Automated reorder points',
      'Equipment maintenance schedules',
      'Supplier management',
    ],
  },
  {
    icon: Settings,
    title: 'Custom Workflows',
    description:
      'Create and automate custom workflows tailored to your business processes and approval requirements.',
    color: 'slate',
    details: [
      'Visual workflow builder',
      'Automated task routing',
      'Conditional logic support',
      'Integration with external tools',
    ],
  },
  {
    icon: Database,
    title: 'Data Integration',
    description:
      'Seamlessly integrate with your existing tools including accounting software, ERP systems, and more.',
    color: 'violet',
    details: [
      'REST API access',
      'Pre-built integrations',
      'Webhook support',
      'Custom data import/export',
    ],
  },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    icon: 'text-pink-600 dark:text-pink-400',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    icon: 'text-slate-600 dark:text-slate-400',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    icon: 'text-violet-600 dark:text-violet-400',
  },
};

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
      <MarketingNav currentPage="Features" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Zap className="mr-2 h-4 w-4" />
            Powerful Features
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            Everything You Need to
            <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text pb-1 text-transparent dark:from-blue-400 dark:to-indigo-400">
              Manage Construction Projects
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
            Our comprehensive platform provides all the tools you need to
            streamline operations, improve efficiency, and deliver projects on
            time and within budget.
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-zinc-50 px-4 py-16 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                <Cloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Cloud-Based Platform
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Access your data anywhere, anytime with our secure cloud
                infrastructure.
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                <RefreshCw className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Regular Updates
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Continuous improvements and new features added based on customer
                feedback.
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Enterprise Security
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Bank-level security with SOC 2 compliance and data encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Complete Feature Set
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Explore all the powerful features designed to transform your
              construction business operations.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const colors = colorClasses[feature.color];
              return (
                <Card
                  key={feature.title}
                  className="group border-zinc-200 bg-white transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80"
                >
                  <CardHeader>
                    <div
                      className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg} transition-transform group-hover:scale-110`}
                    >
                      <Icon className={`h-7 w-7 ${colors.icon}`} />
                    </div>
                    <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="mb-4 text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </CardDescription>
                    <ul className="space-y-2">
                      {feature.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-center text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-zinc-900 px-4 py-24 dark:bg-black">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to Experience These Features?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-300">
            Start your free trial today and see how Echno can transform your
            construction business operations.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => signIn('keycloak')}
              size="lg"
              className="bg-white px-8 text-zinc-900 hover:bg-zinc-100"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/70 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href="/contact#demo">Request a Demo</a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
