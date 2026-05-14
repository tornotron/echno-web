'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthButton } from '@/components/common/auth-button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

interface MarketingNavProps {
  currentPage?: string;
}

export function MarketingNav({ currentPage }: MarketingNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Plans', href: '/plans' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-white/7 dark:bg-zinc-950/95 dark:shadow-none'
          : 'border-b border-transparent bg-stone-50/60 backdrop-blur-sm dark:bg-zinc-950/60'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/e-ai-logo.png"
              alt="Echno"
              width={100}
              height={36}
              className="dark:invert"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-sm font-medium transition-colors duration-200 ${
                  currentPage === link.name
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {link.name}
                {currentPage === link.name && (
                  <span
                    className="absolute inset-x-0 -bottom-1 h-px"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                    }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <AuthButton />
            <Link href="/plans">
              <Button
                variant="gradient"
                className="group rounded-lg px-5 py-2 text-sm shadow-sm shadow-amber-500/20 hover:scale-[1.04] hover:shadow-amber-500/30 active:scale-[0.97]"
              >
                Get Early Access
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <AuthButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white/98 backdrop-blur-md md:hidden dark:border-white/7 dark:bg-zinc-950/98">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  currentPage === link.name
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2">
              <Link href="/plans" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="gradient"
                  className="w-full rounded-xl py-3 text-sm"
                >
                  Get Early Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
