'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { toast } from '@/lib/styles/toast-styles';

import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { HeroSection } from '@/features/home/components/hero-section';
import { TrustedBySection } from '@/features/home/components/trusted-by-section';
import { ProblemsSection } from '@/features/home/components/problems-section';
import { FeaturesSection } from '@/features/home/components/features-section';
import { WorkflowSection } from '@/features/home/components/workflow-section';
import { RoiSection } from '@/features/home/components/roi-section';
import { TestimonialsSection } from '@/features/home/components/testimonials-section';
import { PricingCtaSection } from '@/features/home/components/pricing-cta-section';

/* ── Loading / redirect state ─────────────────────────────────────── */
function LoadingScreen({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: '#0a0a0a' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2"
          style={{ borderColor: '#f59e0b' }}
        />
        <p className="text-sm text-zinc-600">{label}</p>
      </div>
    </div>
  );
}

/* ── Main page content ─────────────────────────────────────────────── */
function HomeContent() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (globalThis.window === undefined) return;
    const params = new URLSearchParams(globalThis.location.search);
    if (status === 'authenticated' && !params.has('error')) {
      router.push('/users/dashboard');
    }
  }, [status, router]);

  // Handle post-logout / error query params
  useEffect(() => {
    if (globalThis.window === undefined) return;
    const params = new URLSearchParams(globalThis.location.search);

    if (params.get('logout') === 'success') {
      toast.success('Signed out successfully', {
        description: 'You have been logged out.',
      });
      router.replace('/', { scroll: false });
      return;
    }

    const errorParam = params.get('error');
    if (errorParam) {
      const messages: Record<string, [string, string]> = {
        logout_failed: [
          'Logout error',
          'There was an issue signing you out. Please try again.',
        ],
        session_invalid: [
          'Session invalid',
          'Your session was invalid and has been cleared.',
        ],
        session_expired: [
          'Session expired',
          'Your session has expired. Please sign in again.',
        ],
        SessionExpired: [
          'Session expired',
          'Your session has expired. Please sign in again.',
        ],
        session_revoked: [
          'Session revoked',
          'Your session was terminated. Please sign in again.',
        ],
      };
      const [title, desc] = messages[errorParam] ?? [
        'Notice',
        'You have been signed out.',
      ];
      toast.info(title, { description: desc });
      router.replace('/', { scroll: false });
    }
  }, [router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <LoadingScreen
        label={status === 'authenticated' ? 'Redirecting…' : 'Loading…'}
      />
    );
  }

  return (
    <div style={{ background: '#0a0a0a' }}>
      <MarketingNav currentPage="Home" />
      <HeroSection />
      <TrustedBySection />
      <ProblemsSection />
      <FeaturesSection />
      <WorkflowSection />
      <RoiSection />
      <TestimonialsSection />
      <PricingCtaSection />
      <MarketingFooter />
    </div>
  );
}

/* ── Export with Suspense boundary ────────────────────────────────── */
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading…" />}>
      <HomeContent />
    </Suspense>
  );
}
