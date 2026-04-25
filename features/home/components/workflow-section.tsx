'use client';

import { useInView } from '@/hooks/use-in-view';

const PHASES = [
  {
    number: '01',
    label: 'Planning',
    title: 'Define the Project',
    description:
      'Set up your project structure, define work packages, allocate budget, and assign your team — all before breaking ground.',
  },
  {
    number: '02',
    label: 'Mobilise',
    title: 'Deploy Your Crew',
    description:
      'Onboard workers, configure shifts, assign equipment, and coordinate material deliveries for a smooth site kickoff.',
  },
  {
    number: '03',
    label: 'Execute',
    title: 'Track Every Day',
    description:
      'Daily attendance, progress reports, material issuance, and real-time issue logging keep everyone accountable.',
  },
  {
    number: '04',
    label: 'Monitor',
    title: 'Stay in Control',
    description:
      'Live dashboards surface delays, cost overruns, and workforce gaps before they become problems.',
  },
  {
    number: '05',
    label: 'Handover',
    title: 'Deliver with Confidence',
    description:
      'Generate completion certificates, audit trails, and final reports in minutes — not days.',
  },
];

export function WorkflowSection() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="relative overflow-hidden border-t border-stone-100 bg-stone-50 px-6 py-28 dark:border-white/4 dark:bg-zinc-950">
      {/* Blueprint vertical rulers — light */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:hidden"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(30,27,75,0.6) 0px, transparent 1px, transparent 120px, rgba(30,27,75,0.6) 120px)',
        }}
        aria-hidden
      />
      {/* Dark */}
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-[0.025] dark:block"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(245,158,11,0.6) 0px, transparent 1px, transparent 120px, rgba(245,158,11,0.6) 120px)',
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl">
        <div ref={ref} className="mb-20 max-w-xl">
          <div
            className={`mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase transition-all duration-600 dark:text-amber-500 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            How It Works
          </div>
          <h2
            className={`text-4xl font-black text-zinc-900 transition-all delay-100 duration-700 sm:text-5xl dark:text-white ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            From Groundbreaking
            <br />
            <span className="text-zinc-400 dark:text-zinc-600">
              to Handover.
            </span>
          </h2>
        </div>

        <div className="relative">
          {/* Base connecting line — sits behind circles via z-0 */}
          <div
            className="absolute top-7 right-0 left-0 hidden h-px bg-stone-200 lg:block dark:bg-white/6"
            style={{ zIndex: 0 }}
            aria-hidden
          />
          {/* Animated amber progress line */}
          <div
            className="absolute top-7 left-0 hidden h-px transition-all duration-[2000ms] ease-out lg:block"
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
              width: isInView ? '100%' : '0%',
              zIndex: 0,
            }}
            aria-hidden
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-6">
            {PHASES.map((phase, i) => (
              <div
                key={phase.number}
                className="reveal-hidden flex flex-col items-start"
                style={{ animationDelay: `${i * 180}ms` }}
                data-visible={isInView}
              >
                {/* Number circle — z-10 + solid bg so it covers the connector line */}
                <div
                  className="relative z-10 mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-stone-50 text-sm font-black transition-all duration-700 dark:bg-zinc-950"
                  style={{
                    borderColor: isInView ? '#f59e0b' : 'rgba(214,211,209,0.8)',
                    boxShadow: isInView
                      ? `0 0 0 4px rgba(245,158,11,0.10)`
                      : 'none',
                    color: isInView ? '#f59e0b' : '#a3a3a3',
                    transitionDelay: `${i * 180 + 500}ms`,
                  }}
                >
                  {phase.number}
                </div>

                <span className="mb-2 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-0.5 text-[10px] font-bold tracking-widest text-amber-700 uppercase dark:border-amber-500/18 dark:bg-amber-500/8 dark:text-amber-500">
                  {phase.label}
                </span>
                <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {phase.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mt-20 text-center transition-all delay-700 duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-600">
            Each phase is tracked, documented, and auditable — ready for your
            clients and compliance teams.
          </p>
        </div>
      </div>
    </section>
  );
}
