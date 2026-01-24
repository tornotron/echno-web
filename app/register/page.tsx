'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RegistrationForm } from '@/features/auth/registration-form';
import Image from 'next/image';
import { Building2, Users, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Project Management',
    description: 'Manage multiple construction sites efficiently',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Connect with your team in real-time',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Track progress with detailed insights',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security for your data',
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
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
      <div className="hidden w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          {/* Logo */}
          <Image
            src="/e-ai-logo.png"
            alt="Echno Logo"
            width={120}
            height={44}
            className="invert"
          />
        </div>

        {/* Center Content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Join Echno Today</h1>
            <p className="mt-3 text-lg text-zinc-400">
              Start managing your construction business with modern tools
              designed for success.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white/5 p-4 backdrop-blur-sm"
              >
                <feature.icon className="mb-2 h-6 w-6 text-blue-400" />
                <h3 className="font-medium text-white">{feature.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-sm text-zinc-500">
          Trusted by 50+ construction companies worldwide
        </p>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex w-full flex-col justify-center bg-zinc-50 px-6 py-8 lg:w-1/2 lg:px-16 dark:bg-black">
        {/* Mobile Logo */}
        <div className="mb-6 flex justify-center lg:hidden">
          <Image
            src="/e-ai-logo.png"
            alt="Echno Logo"
            width={100}
            height={36}
            className="dark:invert"
          />
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
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
