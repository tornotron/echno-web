'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AuthButton } from '@/components/common/auth-button';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface MarketingNavProps {
  currentPage?: string;
}

export function MarketingNav({ currentPage }: MarketingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About Us', href: '/about' },
    { name: 'Plans', href: '/plans' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/e-ai-logo.png"
              alt="Echno Logo"
              width={110}
              height={40}
              className="dark:invert"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  currentPage === link.name
                    ? 'text-indigo-600 dark:text-amber-500'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/plans">
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                Get Early Access
              </Button>
            </Link>
            <AuthButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <AuthButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-base font-medium transition-colors ${
                  currentPage === link.name
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-amber-900/20 dark:text-amber-500'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/plans">
              <Button className="mt-2 w-full bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500">
                Get Early Access
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
