'use client';

import { useInView } from '@/hooks/use-in-view';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TESTIMONIALS = [
  {
    quote:
      'We scaled from 3 sites to 11 in one year. Echno was the only reason we could do that without adding three more operations managers. The attendance alone saves us ₹8 lakh a month in overpayments.',
    name: 'Arun Mehta',
    role: 'Managing Director',
    company: 'Mehta Construction & Developers',
    initials: 'AM',
    accentColor: '#f59e0b',
  },
  {
    quote:
      'I used to spend Sunday night building reports for Monday morning. Now Echno generates them automatically. I spend that time with my family instead — and my clients still get better data.',
    name: 'Priya Nair',
    role: 'Project Manager',
    company: 'Skyline Infra Projects',
    initials: 'PN',
    accentColor: '#38bdf8',
  },
  {
    quote:
      'The materials module caught a 12-tonne cement discrepancy on one site. We would never have found that with spreadsheets. That one catch paid for Echno for five years.',
    name: 'Suresh Reddy',
    role: 'Site Director',
    company: 'Reddy & Associates EPC',
    initials: 'SR',
    accentColor: '#34d399',
  },
];

export function TestimonialsSection() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="relative border-t border-stone-100 bg-white px-6 py-28 dark:border-white/4 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div ref={ref} className="mb-16 text-center">
          <div
            className={`mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase transition-all duration-600 dark:text-amber-500 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Client Stories
          </div>
          <h2
            className={`text-4xl font-black text-zinc-900 transition-all delay-100 duration-700 sm:text-5xl dark:text-white ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            From the Field.
          </h2>
          <p
            className={`mt-4 text-zinc-500 transition-all delay-200 duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Real teams. Real results. No stock photos.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Card
              key={t.name}
              variant="testimonial"
              className="reveal-hidden"
              style={{ animationDelay: `${i * 120}ms` }}
              data-visible={isInView}
            >
              {/* Accent line on hover */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${t.accentColor}70, transparent)`,
                }}
                aria-hidden
              />

              <svg
                className="mb-5 h-8 w-8"
                style={{ color: `${t.accentColor}40` }}
                fill="currentColor"
                viewBox="0 0 32 32"
                aria-hidden
              >
                <path d="M0 16C0 8.268 5.82 2 13 2v6c-3.86 0-7 3.14-7 7v1h7v14H0V16zm18 0C18 8.268 23.82 2 31 2v6c-3.86 0-7 3.14-7 7v1h7v14H18V16z" />
              </svg>

              <p className="flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Avatar
                  className="size-11 shrink-0 bg-transparent"
                  style={{
                    background: `${t.accentColor}14`,
                    border: `1px solid ${t.accentColor}28`,
                  }}
                >
                  <AvatarFallback
                    className="bg-transparent text-sm font-black"
                    style={{ color: t.accentColor }}
                  >
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {t.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
