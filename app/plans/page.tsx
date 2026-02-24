'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ArrowRight,
  HardHat,
  Clock,
  Users,
  Lock,
  Building2,
  ClipboardList,
  CalendarCheck,
} from 'lucide-react';

const includedFeatures = [
  { icon: Clock, text: 'Attendance & Time Tracking' },
  { icon: Users, text: 'Workforce Management' },
  { icon: ClipboardList, text: 'Project & Task Tracking' },
  { icon: Lock, text: 'Role-Based Access Control' },
  { icon: Building2, text: 'Multi-Organization Support' },
  { icon: CalendarCheck, text: 'Leave Management' },
];

export default function PlansPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Waitlist submission failed:', data.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="Plans" />

      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-16">
        <div
          className="pointer-events-none absolute inset-0 dark:opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(161,161,170,0.15) 59px, rgba(161,161,170,0.15) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(161,161,170,0.15) 59px, rgba(161,161,170,0.15) 60px)',
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
            <HardHat className="mr-2 h-4 w-4" />
            Early Access
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            We&apos;re Building Something
            <span className="block text-indigo-600 dark:text-amber-500">
              Powerful
            </span>
          </h1>
          <p className="mx-auto mb-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Echno is in early access. Be among the first to experience
            construction management built for the way your team actually works.
          </p>
          <p className="mx-auto max-w-2xl text-zinc-500">
            Pricing will be announced when we launch publicly. Early access
            members get priority onboarding and special launch pricing.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            What&apos;s Included
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {includedFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.text}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-amber-500" />
                  </div>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Get Early Access
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Join the waitlist and we&apos;ll reach out when your spot is
              ready.
            </p>
          </div>

          {isSubmitted ? (
            <div className="rounded-lg border border-indigo-300 bg-indigo-50/50 p-8 text-center dark:border-amber-500/20 dark:bg-amber-500/5">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-indigo-600 dark:text-amber-500" />
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                You&apos;re on the List!
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Thanks for your interest. We&apos;ll be in touch soon with your
                early access details.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) =>
                    setFormState({ ...formState, name: e.target.value })
                  }
                  placeholder="Your name"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) =>
                    setFormState({ ...formState, email: e.target.value })
                  }
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formState.company}
                  onChange={(e) =>
                    setFormState({ ...formState, company: e.target.value })
                  }
                  placeholder="Your company"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Team Size *
                </label>
                <select
                  required
                  value={formState.teamSize}
                  onChange={(e) =>
                    setFormState({ ...formState, teamSize: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-amber-500"
                >
                  <option value="">Select team size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full bg-indigo-600 py-3 text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Join the Waitlist
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            Need enterprise-level deployment?{' '}
            <Link
              href="/contact"
              className="text-indigo-600 underline hover:text-indigo-500 dark:text-amber-500 dark:hover:text-amber-400"
            >
              Contact us directly
            </Link>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
