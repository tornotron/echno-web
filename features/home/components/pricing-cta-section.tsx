'use client';

import { useState } from 'react';
import { useInView } from '@/hooks/use-in-view';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import { Input, inputVariants } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils/tailwind-utils';

const FEATURES = [
  'Attendance & shift management',
  'Workforce & leave management',
  'Project & task tracking',
  'Materials & inventory control',
  'Billing, payments & budgets',
  'Daily reports & inspections',
  'Analytics dashboard',
  'Priority onboarding support',
];

export function PricingCtaSection() {
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
      if (res.ok) setSubmitted(true);
    } catch {
      // silent — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-stone-100 bg-stone-50 px-6 py-28 dark:border-white/4 dark:bg-zinc-950">
      {/* Blueprint grid — dark only */}
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-[0.025] dark:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,158,11,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden
      />
      {/* Light */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,27,75,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,27,75,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden
      />

      <div ref={ref} className="relative z-10 mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-14 text-center">
          <div
            className={`mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase transition-all duration-600 dark:text-amber-500 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Early Access
          </div>
          <h2
            className={`text-4xl font-black text-zinc-900 transition-all delay-100 duration-700 sm:text-5xl dark:text-white ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Be First on the Site.
          </h2>
          <p
            className={`mt-4 text-zinc-500 transition-all delay-200 duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Echno is rolling out to construction teams now. Secure your spot and
            get priority onboarding,
            <br className="hidden sm:block" /> launch pricing, and a dedicated
            success manager.
          </p>
        </div>

        {/* Split layout */}
        <div
          className={`grid gap-10 transition-all delay-300 duration-700 lg:grid-cols-[1fr_440px] ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
        >
          {/* Left — what's included */}
          <div className="flex flex-col justify-center">
            <h3 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">
              Everything you need to run your sites — in one place.
            </h3>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { val: '99.9%', label: 'Uptime SLA' },
                { val: 'GDPR', label: 'Compliant' },
                { val: '< 10min', label: 'Setup Time' },
              ].map((s) => (
                <div key={s.label}>
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
          <Card variant="form" className="shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                  <CheckCircle2 className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                  You&apos;re on the List!
                </h3>
                <p className="text-sm text-zinc-500">
                  We&apos;ll reach out shortly with your early access details
                  and onboarding schedule.
                </p>
              </div>
            ) : (
              <>
                <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">
                  Request Early Access
                </h3>
                <p className="mb-6 text-sm text-zinc-500">
                  No credit card. No lock-in. Just early access.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
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
                    <Label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Company *
                      </Label>
                      <Input
                        variant="marketing"
                        type="text"
                        required
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
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
                        <option value="">Select…</option>
                        <option value="1-10">1–10</option>
                        <option value="11-50">11–50</option>
                        <option value="51-200">51–200</option>
                        <option value="200+">200+</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={submitting}
                    className="group relative mt-2 w-full overflow-hidden rounded-lg py-3.5"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                    <span
                      className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full"
                      aria-hidden
                    />
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
