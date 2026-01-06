'use client';

import Image from 'next/image';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  ArrowRight,
  Target,
  Heart,
  Lightbulb,
  Users,
  Award,
  Globe,
  Linkedin,
  Twitter,
} from 'lucide-react';
import { signIn } from 'next-auth/react';

const values = [
  {
    icon: Target,
    title: 'Customer Focus',
    description:
      'We put our customers at the center of everything we do, building solutions that solve real problems.',
  },
  {
    icon: Heart,
    title: 'Integrity',
    description:
      'We operate with honesty and transparency in all our business relationships and practices.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We continuously push boundaries to deliver cutting-edge solutions for the construction industry.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description:
      'We believe in the power of teamwork, both internally and with our customers and partners.',
  },
];

const milestones = [
  {
    year: '2018',
    title: 'Company Founded',
    description:
      'Echno was founded with a mission to modernize construction business management.',
  },
  {
    year: '2019',
    title: 'First Major Client',
    description:
      'Secured our first enterprise client and began scaling our platform.',
  },
  {
    year: '2020',
    title: 'Platform 2.0',
    description:
      'Launched major platform update with mobile apps and advanced analytics.',
  },
  {
    year: '2022',
    title: 'Series A Funding',
    description:
      'Raised $15M in Series A to accelerate product development and expansion.',
  },
  {
    year: '2024',
    title: '50+ Enterprise Clients',
    description:
      'Reached milestone of serving over 50 construction companies worldwide.',
  },
  {
    year: '2025',
    title: 'AI-Powered Features',
    description:
      'Introduced AI-powered project forecasting and resource optimization.',
  },
];

const team = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former construction project manager with 15 years of industry experience.',
    image: '/team/sarah.jpg',
  },
  {
    name: 'Michael Rodriguez',
    role: 'CTO & Co-Founder',
    bio: 'Tech veteran with experience building enterprise SaaS platforms.',
    image: '/team/michael.jpg',
  },
  {
    name: 'Emily Thompson',
    role: 'VP of Product',
    bio: 'Product leader focused on creating intuitive user experiences.',
    image: '/team/emily.jpg',
  },
  {
    name: 'David Kim',
    role: 'VP of Engineering',
    bio: 'Engineering leader with expertise in scalable cloud architectures.',
    image: '/team/david.jpg',
  },
];

const stats = [
  { value: '50+', label: 'Enterprise Clients' },
  { value: '10,000+', label: 'Active Users' },
  { value: '500+', label: 'Projects Managed' },
  { value: '99.9%', label: 'Platform Uptime' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
      <MarketingNav currentPage="About Us" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <Award className="mr-2 h-4 w-4" />
                About Echno
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
                Building the Future of
                <span className="block bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text pb-1 text-transparent dark:from-green-400 dark:to-emerald-400">
                  Construction Management
                </span>
              </h1>
              <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Founded in 2018, Echno was born from a simple observation: the
                construction industry was ready for a digital transformation,
                but lacked the right tools to make it happen.
              </p>
              <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Our founders, combining decades of construction and technology
                expertise, set out to build a platform that would revolutionize
                how construction companies manage their operations.
              </p>
            </div>
            <div className="relative">
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-zinc-200 bg-linear-to-br from-green-500/10 to-emerald-500/10 dark:border-zinc-700">
                <Globe className="h-32 w-32 text-green-600/50 dark:text-green-400/50" />
              </div>
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-green-500/20 blur-2xl"></div>
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-zinc-900 px-4 py-16 dark:bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Our Mission
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                To empower construction companies with technology that
                simplifies operations, improves efficiency, and enables them to
                focus on what they do best: building the world around us.
              </p>
              <p className="mb-8 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                We believe that construction professionals deserve tools as
                sophisticated and user-friendly as those in any other industry.
                Our platform is designed to be powerful yet intuitive,
                comprehensive yet easy to adopt.
              </p>
              <ul className="space-y-4">
                {[
                  'Simplify complex project management workflows',
                  'Provide real-time visibility across all operations',
                  'Enable data-driven decision making',
                  'Support sustainable construction practices',
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <CheckCircle2 className="mt-0.5 mr-3 h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card
                    key={value.title}
                    className="border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                      <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      {value.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {value.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-zinc-50 px-4 py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Our Journey
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Key milestones in our mission to transform construction
              management.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-zinc-200 dark:bg-zinc-700"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`w-5/12 ${
                      index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'
                    }`}
                  >
                    <div className="mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      {milestone.year}
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {milestone.title}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {milestone.description}
                    </p>
                  </div>
                  {/* Center dot */}
                  <div className="absolute left-1/2 h-4 w-4 -translate-x-1/2 transform rounded-full border-4 border-white bg-green-600 dark:border-zinc-900 dark:bg-green-400"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Meet Our Leadership
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Our team combines deep industry expertise with cutting-edge
              technology knowledge.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card
                key={member.name}
                className="border-zinc-200 bg-white p-6 text-center transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <Users className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                  {member.name}
                </h3>
                <p className="mb-3 text-sm text-green-600 dark:text-green-400">
                  {member.role}
                </p>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {member.bio}
                </p>
                <div className="flex justify-center space-x-3">
                  <a
                    href="#"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-br from-green-600 to-emerald-700 px-4 py-24 dark:from-green-900 dark:to-emerald-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Join Us in Building the Future
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-green-100">
            Whether you&apos;re looking to transform your construction
            operations or join our team, we&apos;d love to hear from you.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => signIn('keycloak')}
              size="lg"
              className="bg-white px-8 text-green-700 hover:bg-zinc-100"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/70 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href="/contact">Contact Us</a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
