'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function MarketingFooter() {
  const year = new Date().getFullYear();

  const columns = [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Plans & Pricing', href: '/plans' },
        { label: 'Get Early Access', href: '/plans' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-stone-200 bg-stone-100 dark:border-white/5 dark:bg-zinc-950">
      {/* Light blueprint grid */}
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,27,75,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(30,27,75,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden
      />
      {/* Dark blueprint grid */}
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-14 grid grid-cols-2 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <Image
                src="/e-ai-logo.png"
                alt="Echno"
                width={96}
                height={32}
                className="mb-5 dark:invert"
              />
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-zinc-500">
              The operating system for modern construction — built to make every
              site run smarter, faster, and with total confidence.
            </p>
            <div className="flex gap-3">
              {['Li', 'Tw', 'Yt'].map((s) => (
                <div
                  key={s}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-zinc-500 transition-all duration-200 hover:border-stone-300 hover:text-zinc-900 dark:border-white/7 dark:bg-white/4 dark:text-zinc-600 dark:hover:bg-white/8 dark:hover:text-zinc-300"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-5 text-xs font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-600">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-8 text-xs text-zinc-400 sm:flex-row dark:border-white/5 dark:text-zinc-700">
          <span>
            &copy; {year} Tornotron E-Commerce Private Limited. All rights
            reserved.
          </span>
          <span className="rounded-full border border-amber-300/50 bg-amber-50 px-3 py-1 font-medium text-amber-700 dark:border-amber-500/15 dark:bg-amber-500/8 dark:text-amber-600">
            Built in India · Powering Construction Nationwide
          </span>
        </div>
      </div>
    </footer>
  );
}
