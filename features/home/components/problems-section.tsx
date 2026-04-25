'use client';

import { useInView } from '@/hooks/use-in-view';
import { Clock, FileWarning, TrendingDown, Radio } from 'lucide-react';

interface ProblemCardProps {
  icon: React.ReactNode;
  stat: string;
  statLabel: string;
  title: string;
  description: string;
  delay: string;
  isVisible: boolean;
  accentColor: string;
}

function ProblemCard({
  icon,
  stat,
  statLabel,
  title,
  description,
  delay,
  isVisible,
  accentColor,
}: ProblemCardProps) {
  return (
    <div
      className="reveal-hidden group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg dark:border-white/6 dark:bg-zinc-900 dark:hover:border-white/10 dark:hover:shadow-none"
      style={{ animationDelay: delay }}
      data-visible={isVisible}
    >
      {/* Hover glow — dark only */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentColor}08 0%, transparent 100%)`,
        }}
        aria-hidden
      />

      <div className="mb-6 flex items-end gap-2">
        <span
          className="text-5xl leading-none font-black"
          style={{ color: accentColor }}
        >
          {stat}
        </span>
        <span className="mb-1 text-sm font-medium text-zinc-500">
          {statLabel}
        </span>
      </div>

      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}25`,
        }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>

      <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
        {description}
      </p>
    </div>
  );
}

export function ProblemsSection() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  const problems = [
    {
      icon: <Clock className="h-5 w-5" />,
      stat: '73%',
      statLabel: 'of projects face delays',
      title: 'Schedule Overruns',
      description:
        'Disconnected teams, manual updates, and zero real-time visibility cause weeks of preventable delays on every project.',
      accentColor: '#ef4444',
      delay: '0ms',
    },
    {
      icon: <TrendingDown className="h-5 w-5" />,
      stat: '42%',
      statLabel: 'average budget overrun',
      title: 'Cost Spiral',
      description:
        'Without tight materials tracking, sub-contract controls, and live expense visibility, budgets bleed from every direction.',
      accentColor: '#f97316',
      delay: '120ms',
    },
    {
      icon: <FileWarning className="h-5 w-5" />,
      stat: '6hrs',
      statLabel: 'wasted daily on admin',
      title: 'Paperwork Paralysis',
      description:
        'Site engineers drown in daily reports, attendance sheets, and inspection checklists — none searchable or auditable.',
      accentColor: '#eab308',
      delay: '240ms',
    },
    {
      icon: <Radio className="h-5 w-5" />,
      stat: '0%',
      statLabel: 'real-time site visibility',
      title: 'Communication Breakdown',
      description:
        'WhatsApp threads, unread emails, and missed calls mean decisions are made with stale data — and mistakes caught too late.',
      accentColor: '#a78bfa',
      delay: '360ms',
    },
  ];

  return (
    <section className="relative bg-stone-50 px-6 py-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div ref={ref} className="mb-16 max-w-2xl">
          <div
            className={`mb-4 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase transition-all duration-600 dark:text-amber-500 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            The Problem
          </div>
          <h2
            className={`text-4xl leading-tight font-black text-zinc-900 transition-all delay-100 duration-700 sm:text-5xl dark:text-white ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            The Old Way
            <br />
            <span className="text-zinc-400 dark:text-zinc-600">
              Costs You Everything.
            </span>
          </h2>
          <p
            className={`mt-4 text-lg text-zinc-600 transition-all delay-200 duration-700 dark:text-zinc-500 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Construction is one of the world&apos;s largest industries — and one
            of the least digitised. Every day without a system is money left on
            the table.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <ProblemCard key={p.title} {...p} isVisible={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
