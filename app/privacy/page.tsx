'use client';

import Link from 'next/link';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { Shield, ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="" />

      {/* Hero */}
      <section className="px-4 pt-32 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
            <Shield className="mr-2 h-4 w-4" />
            Legal
          </div>
          <h1 className="mb-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Privacy Policy
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
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                Tornotron E-Commerce Private Limited (&quot;the Company&quot;,
                &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates
                Echno Console (&quot;the Platform&quot;). This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                personal information when you use our Platform. We are committed
                to protecting your privacy in accordance with the Information
                Technology Act, 2000 and the Digital Personal Data Protection
                Act, 2023 (DPDPA) of India.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                2. Information We Collect
              </h2>

              <h3 className="mt-4 mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                2.1 Information You Provide
              </h3>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  <strong>Account Information:</strong> Username, full name,
                  email address, password, phone number, date of birth, and
                  gender.
                </li>
                <li>
                  <strong>Profile Information:</strong> Role, organization
                  details, and professional information you choose to provide.
                </li>
                <li>
                  <strong>Employment Data:</strong> Department, designation,
                  employee ID, reporting manager, and other workforce-related
                  information.
                </li>
                <li>
                  <strong>Attendance Data:</strong> Clock-in/clock-out times,
                  location data (if enabled), and attendance records.
                </li>
                <li>
                  <strong>Leave Records:</strong> Leave applications, leave
                  balances, and approval history.
                </li>
                <li>
                  <strong>Project Data:</strong> Project details, task
                  assignments, and progress information.
                </li>
              </ul>

              <h3 className="mt-4 mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                2.2 Information Collected Automatically
              </h3>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  <strong>Device Information:</strong> Browser type, operating
                  system, and device identifiers.
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, features used, and
                  interaction patterns.
                </li>
                <li>
                  <strong>Log Data:</strong> IP address, access times, and
                  referring URLs.
                </li>
                <li>
                  <strong>Cookies:</strong> Session cookies and authentication
                  tokens necessary for the Platform to function.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                3. How We Use Your Information
              </h2>
              <p className="mb-3 leading-relaxed">
                We use your information to:
              </p>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  Provide, maintain, and improve the Platform&apos;s services.
                </li>
                <li>
                  Authenticate your identity and manage your account access.
                </li>
                <li>
                  Process workforce management operations including attendance,
                  leaves, and project assignments.
                </li>
                <li>
                  Enable organizational features such as employee management and
                  team collaboration.
                </li>
                <li>
                  Send service-related notifications, updates, and security
                  alerts.
                </li>
                <li>
                  Analyze usage patterns to improve user experience and Platform
                  performance.
                </li>
                <li>
                  Comply with legal obligations and enforce our terms of
                  service.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                4. Data Sharing and Disclosure
              </h2>
              <p className="mb-3 leading-relaxed">
                We may share your information with:
              </p>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  <strong>Your Organization:</strong> If you are part of an
                  organization on the Platform, your employer/organization
                  administrators may access your employment-related data as part
                  of their workforce management.
                </li>
                <li>
                  <strong>Service Providers:</strong> Third-party vendors who
                  assist us in operating the Platform (e.g., cloud hosting,
                  authentication services). These providers are contractually
                  bound to protect your data.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law,
                  court order, or governmental authority.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets, your data may be
                  transferred as part of the transaction.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                We do <strong>not</strong> sell your personal information to
                third parties.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                5. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your
                personal information, including:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 leading-relaxed">
                <li>Encryption of data in transit (TLS/SSL) and at rest.</li>
                <li>
                  Secure authentication through Keycloak identity management
                  with role-based access control.
                </li>
                <li>Regular security assessments and vulnerability testing.</li>
                <li>
                  Access controls limiting employee access to personal data on a
                  need-to-know basis.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                While we strive to protect your data, no method of electronic
                transmission or storage is 100% secure. We cannot guarantee
                absolute security.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                6. Data Retention
              </h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as your account
                is active or as needed to provide you with our services. We may
                also retain data as necessary to comply with legal obligations,
                resolve disputes, and enforce our agreements. When data is no
                longer required, it will be securely deleted or anonymized.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                7. Your Rights
              </h2>
              <p className="mb-3 leading-relaxed">
                Under applicable data protection laws, you have the right to:
              </p>
              <ul className="list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data
                  we hold about you.
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete personal data.
                </li>
                <li>
                  <strong>Erasure:</strong> Request deletion of your personal
                  data, subject to legal retention requirements.
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Withdraw your consent for
                  data processing at any time, where consent is the basis for
                  processing.
                </li>
                <li>
                  <strong>Grievance Redressal:</strong> Lodge a complaint with
                  us or the relevant data protection authority.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                To exercise any of these rights, please contact us using the
                details provided below.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                8. Cookies and Tracking
              </h2>
              <p className="leading-relaxed">
                The Platform uses essential cookies required for authentication
                and session management. These cookies are strictly necessary for
                the Platform to function and cannot be disabled. We do not use
                advertising or third-party tracking cookies.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                9. Children&apos;s Privacy
              </h2>
              <p className="leading-relaxed">
                The Platform is not intended for individuals under the age of
                18. We do not knowingly collect personal information from
                children. If we become aware that we have collected data from a
                minor, we will take steps to delete it promptly.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                10. Third-Party Services
              </h2>
              <p className="leading-relaxed">
                The Platform integrates with third-party services for
                authentication (Keycloak) and other functionalities. These
                services have their own privacy policies, and we encourage you
                to review them. We are not responsible for the privacy practices
                of third-party services.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                11. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes by posting a notice on the
                Platform or sending you an email. The &quot;Last updated&quot;
                date at the top of this policy indicates when it was last
                revised.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                12. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy or wish to
                exercise your data rights, please contact us:
              </p>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  Tornotron E-Commerce Private Limited
                </p>
                <p className="mt-1">Email: privacy@echnoai.com</p>
                <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Data Protection Officer / Grievance Officer
                </p>
                <p className="text-sm">Email: dpo@echnoai.com</p>
              </div>
            </div>
          </div>

          {/* Cross-link */}
          <div className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              See also our{' '}
              <Link
                href="/terms"
                className="text-indigo-600 hover:underline dark:text-amber-500"
              >
                Terms and Conditions
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
