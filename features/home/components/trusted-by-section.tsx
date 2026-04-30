'use client';

import { Badge } from '@/components/shadcn/badge';

export function TrustedBySection() {
  const companies = [
    'Larsen & Toubro',
    'Shapoorji Pallonji',
    'Prestige Group',
    'DLF Limited',
    'Brigade Group',
    'Sobha Developers',
    'Godrej Properties',
    'Puravankara',
    'Oberoi Realty',
    'Mahindra Lifespaces',
    'Tata Projects',
    'NCC Limited',
  ];

  const allCompanies = [...companies, ...companies];

  return (
    <section className="relative overflow-hidden border-y border-stone-200 bg-white py-10 dark:border-white/5 dark:bg-zinc-900">
      <p className="mb-7 text-center text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase dark:text-zinc-600">
        Trusted by India&apos;s leading construction firms
      </p>

      {/* Fade edges */}
      <div
        className="pointer-events-none absolute top-10 bottom-0 left-0 z-10 w-28 bg-gradient-to-r from-white to-transparent dark:from-zinc-900"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-10 right-0 bottom-0 z-10 w-28 bg-gradient-to-l from-white to-transparent dark:from-zinc-900"
        aria-hidden
      />

      <div className="flex overflow-hidden">
        <div className="animate-marquee flex shrink-0 items-center gap-12 pr-12">
          {allCompanies.map((name, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-3 whitespace-nowrap"
            >
              <Badge variant="brand">
                {name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </Badge>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-500">
                {name}
              </span>
              <span className="mx-4 text-stone-200 dark:text-zinc-800">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
