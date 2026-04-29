'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Users,
  HardHat,
  Package,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  {
    num: '01',
    icon: Users,
    accent: '#f59e0b',
    title: 'Workforce Management',
    desc: 'Manage employees, contractors, and subcontractors across all sites. Track roles, departments, certifications, and daily on-site headcount from a single dashboard.',
    bullets: [
      'Employee profiles & directories',
      'Multi-site headcount tracking',
      'Role-based team assignments',
    ],
    tag: 'Core',
  },
  {
    num: '02',
    icon: HardHat,
    accent: '#38bdf8',
    title: 'Attendance & Shifts',
    desc: 'GPS-verified check-ins, configurable shift patterns, and automated timesheet generation — no more paper registers.',
    bullets: [
      'GPS-verified check-ins',
      'Configurable shift patterns',
      'Automated timesheets',
    ],
    tag: undefined,
  },
  {
    num: '03',
    icon: Package,
    accent: '#a78bfa',
    title: 'Materials & Inventory',
    desc: 'Track stock levels, issue materials to work orders, and get low-stock alerts before deliveries stall progress.',
    bullets: [
      'Real-time stock visibility per site',
      'Material issuance to work orders',
      'Low-stock alerts & reorder triggers',
    ],
    tag: undefined,
  },
  {
    num: '04',
    icon: FileText,
    accent: '#34d399',
    title: 'Reports & Inspections',
    desc: 'Standardised daily progress reports, quality inspections, safety audits, and punch lists — all digital, all searchable.',
    bullets: [
      'Daily site progress reports',
      'Quality & safety inspections',
      'Photo-attached punch lists',
    ],
    tag: 'Popular',
  },
  {
    num: '05',
    icon: CreditCard,
    accent: '#fb923c',
    title: 'Billing & Payments',
    desc: 'Generate invoices, track payment milestones, manage contractor bills, and reconcile budgets with live expense feeds.',
    bullets: [
      'Invoice generation & tracking',
      'Payment milestone management',
      'Live budget vs. actuals',
    ],
    tag: undefined,
  },
  {
    num: '06',
    icon: MessageSquare,
    accent: '#f472b6',
    title: 'Team Communication',
    desc: 'Project-scoped chat, announcements, and document sharing — keep conversations tied to context, not lost in WhatsApp.',
    bullets: [
      'Project-scoped chat rooms',
      'Organisation-wide announcements',
      'Document & photo sharing',
    ],
    tag: undefined,
  },
  {
    num: '07',
    icon: BarChart3,
    accent: '#facc15',
    title: 'Analytics Dashboard',
    desc: 'Customisable dashboards for owners and PMs — KPIs, earned value, cost trends, and workforce productivity at a glance.',
    bullets: [
      'Real-time KPI dashboards',
      'Earned value analysis',
      'Workforce productivity metrics',
    ],
    tag: 'Enterprise',
  },
] as const;

export function FeaturesSection() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const outerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    let prev = 0;
    function onScroll() {
      if (!outer) return;
      const rect = outer.getBoundingClientRect();
      const total = outer.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(0.9999, -rect.top / total));
      const step = Math.min(
        STEPS.length - 1,
        Math.floor(progress * STEPS.length)
      );
      if (step !== prev) {
        prev = step;
        setActive(step);
        setAnimKey((k) => k + 1);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function goTo(i: number) {
    setActive(i);
    setAnimKey((k) => k + 1);
  }

  const step = STEPS[active];

  return (
    <section
      ref={outerRef as React.RefObject<HTMLElement>}
      className="relative border-t border-stone-100 bg-stone-50 dark:border-white/4 dark:bg-zinc-950"
      style={{ minHeight: `${STEPS.length * 85}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Ghost background number */}
        <div
          aria-hidden
          className="pointer-events-none absolute leading-none font-black text-zinc-900/[0.025] select-none dark:text-white/[0.025]"
          style={{
            right: '-2vw',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '32vw',
          }}
        >
          {step.num}
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-12">
          {/* ── Mobile / tablet  (< lg) — horizontal sliding cards ── */}
          <div className="lg:hidden">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-1 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
                Platform Capabilities
              </div>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-3xl leading-tight font-black text-zinc-900 dark:text-white">
                  One Platform.
                  <br />
                  Total Command.
                </h2>
                <span className="mb-1 shrink-0 font-mono text-sm text-zinc-400 dark:text-zinc-600">
                  <span style={{ color: step.accent }}>{step.num}</span>
                  {' / '}
                  {String(STEPS.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Sliding card track */}
            <div className="overflow-hidden">
              <div
                className="flex"
                style={{
                  width: `${STEPS.length * 100}%`,
                  transform: `translateX(-${active * (100 / STEPS.length)}%)`,
                  transition:
                    'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                {STEPS.map((s) => (
                  <div
                    key={s.num}
                    className="shrink-0 pr-6"
                    style={{ width: `${100 / STEPS.length}%` }}
                  >
                    {/* Gradient number */}
                    <div
                      className="mb-3 leading-none font-black"
                      style={{
                        fontSize: 'clamp(3rem,10vw,5rem)',
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        background: `linear-gradient(135deg, ${s.accent}, #ea580c)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {s.num}
                    </div>
                    <h3 className="mb-3 text-2xl leading-tight font-bold text-zinc-900 dark:text-white">
                      {s.title}
                    </h3>
                    <p className="mb-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {s.desc}
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: s.accent }}
                          />
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Desktop  (lg+) — two-column nav + detail ── */}
          <div className="hidden items-center gap-28 lg:grid lg:grid-cols-2">
            {/* Left: label + steps nav */}
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
                Platform Capabilities
              </div>
              <h2 className="mb-10 text-5xl leading-tight font-black text-zinc-900 dark:text-white">
                One Platform.
                <br />
                Total Command.
              </h2>

              <nav className="flex flex-col">
                {STEPS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`group relative flex items-center gap-6 border-b border-stone-200 py-5 text-left transition-all duration-300 dark:border-white/[0.06] ${active === i ? 'pl-2.5' : ''}`}
                  >
                    <div
                      className="absolute top-0 left-0 w-0.5 bg-amber-500 transition-all duration-[400ms]"
                      style={{ height: active === i ? '100%' : 0 }}
                    />
                    <span
                      className={`min-w-[28px] font-mono text-xs font-semibold tracking-widest transition-colors duration-300 ${active === i ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-600'}`}
                    >
                      {s.num}
                    </span>
                    <span
                      className={`text-lg font-semibold transition-colors duration-300 ${active === i ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}
                    >
                      {s.title}
                    </span>
                    {s.tag && active === i && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-[10px] font-bold tracking-wide uppercase"
                        style={{
                          background: `${s.accent}15`,
                          color: s.accent,
                          borderColor: `${s.accent}35`,
                        }}
                      >
                        {s.tag}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right: step detail */}
            <div key={animKey} className="animate-fade-up">
              <div
                className="mb-4 leading-none font-black"
                style={{
                  fontSize: 'clamp(4rem,7vw,6rem)',
                  letterSpacing: '-0.05em',
                  lineHeight: 1,
                  background: `linear-gradient(135deg, ${step.accent}, #ea580c)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {step.num}
              </div>
              <h3
                className="mb-6 font-bold text-zinc-900 dark:text-white"
                style={{
                  fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
                  letterSpacing: '-0.04em',
                }}
              >
                {step.title}
              </h3>
              <p className="mb-8 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {step.desc}
              </p>
              <ul className="flex flex-col gap-3">
                {step.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: step.accent }}
                    />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-8 left-6 flex items-center gap-2 lg:left-12">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i === active ? 'scale-150 bg-amber-500' : 'bg-zinc-300 dark:bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
