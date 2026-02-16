'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RegistrationForm } from '@/features/auth/registration-form';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Users, Clock, Lock, HardHat } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Attendance Tracking',
    description: 'Real-time workforce attendance across all sites',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Manage employees, roles, and hierarchies',
  },
  {
    icon: Building2,
    title: 'Multi-Site Support',
    description: 'Run multiple projects from one dashboard',
  },
  {
    icon: Lock,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade access control and security',
  },
];

export default function RegisterPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500 dark:border-amber-500"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="relative hidden w-1/2 bg-white p-12 lg:flex lg:flex-col lg:justify-between dark:bg-zinc-950">
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
        <div>
          <Link href="/">
            <Image
              src="/e-ai-logo.png"
              alt="Echno Logo"
              width={120}
              height={44}
              className="dark:invert"
            />
          </Link>
        </div>

        {/* Center Content */}
        <div className="space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
              <HardHat className="mr-2 h-4 w-4" />
              Join the Platform
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Start Managing Your
              <span className="block text-indigo-600 dark:text-amber-500">
                Construction Business
              </span>
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              Create your account and get access to modern tools designed for
              construction teams.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <feature.icon className="mb-2 h-6 w-6 text-indigo-600 dark:text-amber-500" />
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Powering construction teams across India
        </p>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex w-full flex-col justify-center bg-zinc-50 px-6 py-8 lg:w-1/2 lg:px-16 dark:bg-zinc-900">
        {/* Mobile Logo */}
        <div className="mb-6 flex justify-center lg:hidden">
          <Link href="/">
            <Image
              src="/e-ai-logo.png"
              alt="Echno Logo"
              width={100}
              height={36}
              className="dark:invert"
            />
          </Link>
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Fill in your details to get started
            </p>
          </div>

          {/* Registration Form */}
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
