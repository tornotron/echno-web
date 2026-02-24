'use client';

import Image from 'next/image';
import Link from 'next/link';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <Image
                src="/e-ai-logo.png"
                alt="Echno Logo"
                width={100}
                height={40}
                className="mb-4 dark:invert"
              />
            </Link>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Modern construction business management for the future.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/plans"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/plans"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Get Early Access
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Company
            </h4>
            <ul className="space-y-2">
              {/* <li>
                <Link
                  href="/about"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  About Us
                </Link>
              </li> */}
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            &copy; {currentYear} Tornotron E-Commerce Private Limited. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
