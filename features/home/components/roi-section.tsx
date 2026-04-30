'use client';

import { useInView } from '@/hooks/use-in-view';
import { useCountUp } from '@/hooks/use-count-up';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';

interface StatProps {
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  isActive: boolean;
  delay: number;
}

function AnimatedStat({
  value,
  suffix,
  label,
  sublabel,
  isActive,
  delay,
}: StatProps) {
  const count = useCountUp(value, isActive, 2400);

  return (
    <div
      className="reveal-hidden flex flex-col items-center text-center"
      style={{ animationDelay: `${delay}ms` }}
      data-visible={isActive}
    >
      <div
        className="mb-2 text-6xl leading-none font-black tracking-tight text-transparent sm:text-7xl"
        style={{
          backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
      >
        {count}
        {suffix}
      </div>
      <div className="mb-1 text-base font-bold text-zinc-900 dark:text-zinc-200">
        {label}
      </div>
      <div className="text-sm text-zinc-500">{sublabel}</div>
    </div>
  );
}

export function RoiSection() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  const stats: Omit<StatProps, 'isActive'>[] = [
    {
      value: 30,
      suffix: '%',
      label: 'Faster Reporting',
      sublabel: 'Daily site reports generated automatically',
      delay: 0,
    },
    {
      value: 22,
      suffix: '%',
      label: 'Fewer Delays',
      sublabel: 'Avg. schedule improvement after 90 days',
      delay: 200,
    },
    {
      value: 40,
      suffix: '%',
      label: 'Less Admin Work',
      sublabel: 'Hours saved per project manager per week',
      delay: 400,
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-stone-200 bg-stone-100 px-6 py-32 dark:border-white/4 dark:bg-zinc-900">
      {/* Amber glow — dark only */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 hidden h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl dark:block"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl">
        <div
          className={`mb-3 text-center text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase transition-all duration-600 dark:text-amber-500 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          Measurable Results
        </div>
        <h2
          className={`mb-16 text-center text-4xl font-black text-zinc-900 transition-all delay-100 duration-700 sm:text-5xl dark:text-white ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          Built to Move the Needle.
        </h2>

        <div className="grid grid-cols-1 gap-16 sm:grid-cols-3">
          {stats.map((s) => (
            <AnimatedStat key={s.label} {...s} isActive={isInView} />
          ))}
        </div>

        <div className="my-20 h-px w-full bg-stone-200 dark:bg-white/5" />

        {/* Testimonial quote */}
        <div
          className={`mx-auto max-w-3xl text-center transition-all delay-500 duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
        >
          <svg
            className="mx-auto mb-6 h-10 w-10 text-amber-400/40"
            fill="currentColor"
            viewBox="0 0 32 32"
            aria-hidden
          >
            <path d="M0 16C0 8.268 5.82 2 13 2v6c-3.86 0-7 3.14-7 7v1h7v14H0V16zm18 0C18 8.268 23.82 2 31 2v6c-3.86 0-7 3.14-7 7v1h7v14H18V16z" />
          </svg>
          <p className="text-xl leading-relaxed font-medium text-zinc-700 sm:text-2xl dark:text-zinc-300">
            Within two months of deploying Echno across our six active sites,
            our project managers reclaimed hours they were spending on reports.
            The visibility alone justified the entire investment.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Avatar className="size-11 bg-amber-100 dark:bg-amber-500/15">
              <AvatarFallback className="bg-amber-100 text-sm font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-500">
                RK
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Rajesh Kumar
              </div>
              <div className="text-xs text-zinc-500">
                COO, Prestige Infrastructure Pvt. Ltd.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
