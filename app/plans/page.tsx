'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { useInView } from '@/hooks/use-in-view';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input, inputVariants } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils/index';

const INCLUDED = [
  'Attendance & shift management',
  'GPS-verified check-ins',
  'Workforce & leave management',
  'Project & task tracking',
  'Materials & inventory control',
  'Daily reports & inspections',
  'Billing, payments & budgets',
  'Team communication hub',
  'Analytics & custom dashboards',
  'Role-based access control',
  'Multi-organization support',
  'Priority onboarding support',
];

export default function PlansPage() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Submission failed:', data.error);
        return;
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      <MarketingNav currentPage="Plans" />

      {/* Hero */}
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
        {/* Dark amber glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 hidden h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl dark:block"
          style={{
            background: 'radial-gradient(circle, #f59e0b, transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 dark:border-amber-500/20 dark:bg-amber-500/6">
            <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Early Access — Limited Spots
            </span>
          </div>
          <h1 className="mb-6 text-5xl leading-tight font-black text-zinc-900 sm:text-6xl dark:text-white">
            Be First on the Site.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Echno is rolling out now. Join the early access program and get
            priority onboarding, special launch pricing, and a dedicated success
            manager.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 pb-28">
        <div ref={ref} className="mx-auto max-w-6xl">
          <div
            className={`grid gap-12 transition-all duration-700 lg:grid-cols-[1fr_480px] ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            {/* Left — what's included */}
            <div>
              <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-white">
                Everything you need — included.
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {INCLUDED.map((f) => (
                  <Card key={f} variant="feature-item">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {f}
                    </span>
                  </Card>
                ))}
              </div>

              {/* Trust signals */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-stone-200 pt-10 dark:border-white/5">
                {[
                  { val: '99.9%', label: 'Uptime SLA' },
                  { val: 'GDPR', label: 'Compliant' },
                  { val: '< 10min', label: 'Setup Time' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                      {s.val}
                    </div>
                    <div className="text-xs font-medium text-zinc-500">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <Card variant="form">
              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                    <CheckCircle2 className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                    You&apos;re on the List!
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Thanks for your interest. We&apos;ll reach out shortly with
                    your early access details and onboarding schedule.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">
                    Request Early Access
                  </h3>
                  <p className="mb-6 text-sm text-zinc-500">
                    No credit card. No lock-in. We&apos;ll reach out to schedule
                    your demo.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Full Name *
                      </Label>
                      <Input
                        variant="marketing"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Work Email *
                      </Label>
                      <Input
                        variant="marketing"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="you@company.com"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Company Name *
                      </Label>
                      <Input
                        variant="marketing"
                        type="text"
                        required
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                        placeholder="Your company"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Team Size *
                      </Label>
                      <select
                        required
                        value={form.teamSize}
                        onChange={(e) =>
                          setForm({ ...form, teamSize: e.target.value })
                        }
                        className={cn(inputVariants({ variant: 'marketing' }))}
                      >
                        <option value="">Select team size…</option>
                        <option value="1-10">1–10 employees</option>
                        <option value="11-50">11–50 employees</option>
                        <option value="51-200">51–200 employees</option>
                        <option value="200+">200+ employees</option>
                      </select>
                    </div>
                    <Button
                      variant="gradient"
                      size="xl"
                      type="submit"
                      disabled={submitting}
                      className="group relative mt-2 w-full overflow-hidden font-bold"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />{' '}
                            Submitting…
                          </>
                        ) : (
                          <>
                            Join the Waitlist{' '}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                      <span
                        className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full"
                        aria-hidden
                      />
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-xs text-zinc-500">
                    Need a custom enterprise plan?{' '}
                    <Link
                      href="/contact"
                      className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                    >
                      Contact us →
                    </Link>
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
