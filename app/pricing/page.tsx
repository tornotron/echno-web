'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Zap, X, HelpCircle } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small teams just getting started',
    price: { monthly: 29, annually: 24 },
    popular: false,
    features: [
      { text: 'Up to 10 team members', included: true },
      { text: '3 active projects', included: true },
      { text: 'Basic analytics dashboard', included: true },
      { text: 'Email support', included: true },
      { text: '5GB document storage', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Custom integrations', included: false },
      { text: 'API access', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    name: 'Professional',
    description: 'Best for growing construction businesses',
    price: { monthly: 79, annually: 66 },
    popular: true,
    features: [
      { text: 'Up to 50 team members', included: true },
      { text: 'Unlimited projects', included: true },
      { text: 'Advanced analytics dashboard', included: true },
      { text: 'Priority support (24/7)', included: true },
      { text: '50GB document storage', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'API access', included: true },
      { text: 'Team training session', included: true },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with complex needs',
    price: { monthly: null, annually: null },
    popular: false,
    features: [
      { text: 'Unlimited team members', included: true },
      { text: 'Unlimited projects', included: true },
      { text: 'Custom analytics & reporting', included: true },
      { text: 'Dedicated 24/7 support', included: true },
      { text: 'Unlimited document storage', included: true },
      { text: 'White-label mobile app', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Full API access', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'On-premise deployment option', included: true },
    ],
  },
];

const faqs = [
  {
    question: 'Can I switch plans at any time?',
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
  },
  {
    question: 'Is there a free trial available?',
    answer:
      'Yes! We offer a 14-day free trial on all plans. No credit card required. You can explore all features before making a commitment.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, MasterCard, American Express), as well as bank transfers for annual enterprise contracts.',
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer:
      "We offer a 30-day money-back guarantee. If you're not completely satisfied, contact us for a full refund.",
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer:
      'Yes! Save up to 20% when you choose annual billing. The discount is automatically applied when you select the annual option.',
  },
  {
    question: 'What happens when I exceed my storage limit?',
    answer:
      "We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional storage as needed.",
  },
];

const addons = [
  {
    name: 'Additional Storage',
    description: 'Add more document storage capacity',
    price: '$10/month per 10GB',
  },
  {
    name: 'Extra Team Members',
    description: 'Add more users beyond your plan limit',
    price: '$5/month per user',
  },
  {
    name: 'Custom Training',
    description: 'Personalized onboarding and training sessions',
    price: '$500 one-time',
  },
  {
    name: 'Premium Support',
    description: '1-hour response time SLA',
    price: '$200/month',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(
    'monthly'
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
      <MarketingNav currentPage="Pricing" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <Zap className="mr-2 h-4 w-4" />
            Simple Pricing
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            Plans That Scale With
            <span className="block bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text pb-1 text-transparent dark:from-purple-400 dark:to-indigo-400">
              Your Business
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Transparent pricing with no hidden fees. Choose the plan that fits
            your needs and scale as your business grows.
          </p>

          {/* Billing Toggle */}
          <div className="mb-12 flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${
                billingCycle === 'monthly'
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === 'monthly' ? 'annually' : 'monthly'
                )
              }
              className={`relative h-7 w-14 rounded-full transition-colors ${
                billingCycle === 'annually'
                  ? 'bg-purple-600'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <div
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                  billingCycle === 'annually'
                    ? 'translate-x-8'
                    : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billingCycle === 'annually'
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Annually
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                Save 20%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-2 transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'scale-105 border-purple-500 dark:border-purple-400'
                    : 'border-zinc-200 dark:border-zinc-700'
                } bg-white dark:bg-zinc-800`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                    <span className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader
                  className={`text-center ${plan.popular ? 'pt-10' : 'pt-6'}`}
                >
                  <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-600 dark:text-zinc-400">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    {plan.price.monthly ? (
                      <>
                        <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
                          $
                          {billingCycle === 'monthly'
                            ? plan.price.monthly
                            : plan.price.annually}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          /month
                        </span>
                        {billingCycle === 'annually' && (
                          <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                            Billed annually (${plan.price.annually! * 12}/year)
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                        Custom
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start">
                        {feature.included ? (
                          <CheckCircle2 className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                          <X className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                        )}
                        <span
                          className={
                            feature.included
                              ? 'text-zinc-700 dark:text-zinc-300'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {plan.price.monthly ? (
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => signIn('keycloak')}
                    >
                      Start Free Trial
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/contact">Contact Sales</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="bg-zinc-50 px-4 py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Customize Your Plan
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Add extra features and capacity as your needs evolve.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {addons.map((addon) => (
              <Card
                key={addon.name}
                className="border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {addon.name}
                </h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {addon.description}
                </p>
                <p className="font-medium text-purple-600 dark:text-purple-400">
                  {addon.price}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Have questions? We have answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="overflow-hidden border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {faq.question}
                  </span>
                  <HelpCircle
                    className={`h-5 w-5 text-zinc-400 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-zinc-600 dark:text-zinc-400">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-zinc-900 px-4 py-24 dark:bg-black">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-300">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => signIn('keycloak')}
              size="lg"
              className="bg-purple-600 px-8 text-white hover:bg-purple-700"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/70 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
