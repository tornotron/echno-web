import { Suspense } from 'react';

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
import { HomeNotifications } from '@/features/home/components/home-notifications';

export default function Home() {
  return (
    <div style={{ background: '#0a0a0a' }}>
      <MarketingNav currentPage="Home" />
      <Suspense fallback={null}>
        <HomeNotifications />
      </Suspense>
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
