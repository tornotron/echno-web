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
    { name: 'Features', href: '/features' },
    // { name: 'About Us', href: '/about' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
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
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/contact#demo">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Request Demo
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
        <div className="border-b border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-3 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-base font-medium transition-colors ${
                  currentPage === link.name
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/contact#demo">
              <Button className="mt-2 w-full" variant="outline">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
