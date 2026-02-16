'use client';

import Link from 'next/link';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { FileText, ArrowRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="" />

      {/* Hero */}
      <section className="px-4 pt-32 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
            <FileText className="mr-2 h-4 w-4" />
            Legal
          </div>
          <h1 className="mb-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Terms and Conditions
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: February 17, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10 text-zinc-700 dark:text-zinc-300">
            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing or using Echno Console (&quot;the Platform&quot;),
                operated by Tornotron E-Commerce Private Limited (&quot;the
                Company&quot;, &quot;we&quot;, &quot;us&quot;, or
                &quot;our&quot;), you agree to be bound by these Terms and
                Conditions. If you do not agree to these terms, you must not use
                the Platform.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                2. Description of Service
              </h2>
              <p className="leading-relaxed">
                Echno Console is a workforce and project management platform
                designed for construction businesses. The Platform provides
                tools for project management, team collaboration, attendance
                tracking, leave management, employee management, and related
                business operations.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                3. User Accounts
              </h2>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  You must be at least 18 years old to create an account on the
                  Platform.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activities that occur
                  under your account.
                </li>
                <li>
                  You agree to provide accurate, current, and complete
                  information during registration and to keep your account
                  information updated.
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your
                  account or any other breach of security.
                </li>
                <li>
                  We reserve the right to suspend or terminate accounts that
                  violate these terms or are inactive for extended periods.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                4. Acceptable Use
              </h2>
              <p className="mb-3 leading-relaxed">You agree not to:</p>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  Use the Platform for any unlawful purpose or in violation of
                  any applicable laws or regulations.
                </li>
                <li>
                  Attempt to gain unauthorized access to other user accounts,
                  computer systems, or networks connected to the Platform.
                </li>
                <li>
                  Upload or transmit viruses, malware, or any other malicious
                  code.
                </li>
                <li>
                  Interfere with or disrupt the integrity or performance of the
                  Platform.
                </li>
                <li>
                  Reverse engineer, decompile, or disassemble any part of the
                  Platform.
                </li>
                <li>
                  Use automated tools (bots, scrapers) to access the Platform
                  without our prior written consent.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                5. Intellectual Property
              </h2>
              <p className="leading-relaxed">
                All content, features, and functionality of the Platform,
                including but not limited to text, graphics, logos, icons,
                software, and the compilation thereof, are the exclusive
                property of Tornotron E-Commerce Private Limited and are
                protected by Indian and international copyright, trademark, and
                other intellectual property laws.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                6. User Content and Data
              </h2>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  You retain ownership of data and content you submit to the
                  Platform.
                </li>
                <li>
                  By submitting content, you grant us a limited license to use,
                  store, and process it as necessary to provide the
                  Platform&apos;s services.
                </li>
                <li>
                  You are responsible for ensuring that any content you submit
                  does not infringe on the rights of any third party.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                7. Organization and Employee Data
              </h2>
              <p className="leading-relaxed">
                Organizations using the Platform are responsible for ensuring
                they have the appropriate consent from their employees before
                entering employee data into the Platform. The Company acts as a
                data processor on behalf of the organization (data controller)
                for employee data managed through the Platform.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                8. Service Availability
              </h2>
              <p className="leading-relaxed">
                We strive to maintain the Platform&apos;s availability but do
                not guarantee uninterrupted access. We may temporarily suspend
                the Platform for maintenance, updates, or due to circumstances
                beyond our control. We will make reasonable efforts to provide
                advance notice of planned downtime.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                9. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by applicable law, Tornotron
                E-Commerce Private Limited shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages,
                including loss of profits, data, or business opportunities,
                arising from your use of the Platform. Our total liability shall
                not exceed the amount paid by you, if any, for accessing the
                Platform during the twelve months preceding the claim.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                10. Disclaimer of Warranties
              </h2>
              <p className="leading-relaxed">
                The Platform is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, whether express
                or implied, including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                11. Termination
              </h2>
              <p className="leading-relaxed">
                We may terminate or suspend your access to the Platform at any
                time, with or without cause, upon reasonable notice. Upon
                termination, your right to use the Platform will immediately
                cease. Provisions that by their nature should survive
                termination shall remain in effect.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                12. Changes to Terms
              </h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. We will
                notify users of material changes via email or through a notice
                on the Platform. Continued use of the Platform after changes
                become effective constitutes acceptance of the revised Terms.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                13. Governing Law
              </h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of India. Any disputes arising under these Terms
                shall be subject to the exclusive jurisdiction of the courts in
                Kerala, India.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                14. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  Tornotron E-Commerce Private Limited
                </p>
                <p className="mt-1">Email: support@echnoai.com</p>
              </div>
            </div>
          </div>

          {/* Cross-link */}
          <div className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              See also our{' '}
              <Link
                href="/privacy"
                className="text-indigo-600 hover:underline dark:text-amber-500"
              >
                Privacy Policy
              </Link>
            </p>
            <Link
              href="/register"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline dark:text-amber-500"
            >
              Back to Registration
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
