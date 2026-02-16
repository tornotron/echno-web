'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ArrowRight,
  HardHat,
  Linkedin,
  Twitter,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const milestones = [
  {
    year: '2021',
    label: 'Foundation',
    title: 'Tornotron Technologies Founded',
    description:
      'Founded by IITM students with a vision to offer simplified digital solutions for small and medium businesses.',
  },
  {
    year: '2022',
    label: 'Framework',
    title: 'Digital Solutions Launch',
    description:
      'Started offering website development, e-commerce, and marketing solutions to help businesses build their digital identity.',
  },
  {
    year: '2023',
    label: 'Structure',
    title: 'Echno Project Initiated',
    description:
      'Identified the challenges faced by construction businesses and began development of the Echno platform.',
  },
  {
    year: '2024',
    label: 'Build-Out',
    title: 'Platform Development',
    description:
      'Focused development on core features including project management, attendance tracking, and team collaboration.',
  },
  {
    year: '2025',
    label: 'Launch',
    title: 'MVP Launch',
    description:
      'Successfully launched the Echno MVP, bringing construction business management to the next level.',
  },
];

const team = [
  {
    name: 'Aneesh K Johny',
    role: 'Co-Founder & CFO',
    bio: 'IITM alumnus driving financial strategy and business growth.',
    image: '/team/cfo.jpg',
  },
  {
    name: 'Abhijith A',
    role: 'Co-Founder & CTO',
    bio: 'IITM alumnus leading technology vision and platform architecture.',
    image: '/team/cto.jpg',
  },
  {
    name: 'Anand Rajasekhar',
    role: 'Chief Executive Officer',
    bio: 'Driving company vision, strategy, and market expansion.',
    image: '/team/ceo.png',
  },
  {
    name: 'Abin K Johny',
    role: 'Frontend Developer',
    bio: 'Crafting intuitive and responsive user interfaces.',
    image: '/team/frontend.jpg',
  },
  {
    name: 'Hrishikesh A',
    role: 'Backend Developer',
    bio: 'Building robust and scalable server-side solutions.',
    image: '/team/backend.jpg',
  },
];

const stats = [
  { value: '2021', label: 'Founded' },
  { value: 'IITM', label: 'Alumni Founded' },
  { value: '2025', label: 'MVP Launched' },
  { value: '99.9%', label: 'Platform Uptime' },
];

export default function AboutPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500 dark:border-amber-500"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="About Us" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
                <HardHat className="mr-2 h-4 w-4" />
                About Echno
              </div>
              <h1 className="mb-6 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
                From IIT Madras to the
                <span className="block text-indigo-600 dark:text-amber-500">
                  Construction Site
                </span>
              </h1>
              <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tornotron Technologies Private Limited was founded in 2021 by
                IITM students with a mission to offer simplified digital
                solutions for small and medium businesses to build their digital
                identity.
              </p>
              <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Starting with website development, e-commerce, and marketing
                solutions, we later identified the unique challenges faced by
                the construction industry. This led to the creation of Echno
                &mdash; a comprehensive platform designed to streamline
                construction business operations and workflows.
              </p>
            </div>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div
                className="pointer-events-none absolute inset-0 dark:hidden"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(79,70,229,0.1) 29px, rgba(79,70,229,0.1) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(79,70,229,0.1) 29px, rgba(79,70,229,0.1) 60px)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 hidden opacity-40 dark:block"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(245,158,11,0.12) 29px, rgba(245,158,11,0.12) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(245,158,11,0.12) 29px, rgba(245,158,11,0.12) 30px)',
                }}
              />
              <HardHat className="h-32 w-32 text-indigo-500/20 dark:text-amber-500/20" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-3xl dark:bg-amber-500/10"></div>
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-black text-indigo-600 dark:text-amber-500">
                  {stat.value}
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {stat.label}
                </div>
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
              <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Our Mission
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                To provide simplified digital solutions that empower small and
                medium businesses to build their digital identity and streamline
                their operations with ease.
              </p>
              <p className="mb-8 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                With Echno, we&apos;re bringing the same commitment to the
                construction industry &mdash; offering powerful yet intuitive
                tools that help construction businesses manage projects, teams,
                and workflows efficiently.
              </p>
              <ul className="space-y-4">
                {[
                  'Simplify complex project management workflows',
                  'Provide real-time visibility across all operations',
                  'Enable data-driven decision making',
                  'Build tools construction teams actually want to use',
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <CheckCircle2 className="mt-0.5 mr-3 h-6 w-6 shrink-0 text-indigo-600 dark:text-amber-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: 'Customer Focus',
                  description:
                    'We put our customers at the center of everything we do, building solutions that solve real problems.',
                },
                {
                  title: 'Integrity',
                  description:
                    'We operate with honesty and transparency in all our business relationships and practices.',
                },
                {
                  title: 'Innovation',
                  description:
                    'We continuously push boundaries to deliver cutting-edge solutions for the construction industry.',
                },
                {
                  title: 'Collaboration',
                  description:
                    'We believe in the power of teamwork, both internally and with our customers and partners.',
                },
              ].map((value) => (
                <div
                  key={value.title}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                    {value.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section — Left-aligned with construction metaphors */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Our Journey
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Key milestones in building Echno &mdash; from foundation to
              launch.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 left-4 h-full w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>

            <div className="space-y-12">
              {milestones.map((milestone) => (
                <div key={milestone.year} className="relative pl-14">
                  {/* Dot */}
                  <div className="absolute top-1 left-2 h-5 w-5 rounded-full border-4 border-zinc-50 bg-indigo-500 dark:border-zinc-900 dark:bg-amber-500"></div>

                  <div className="mb-1 flex items-center gap-3">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-sm font-bold text-indigo-700 dark:bg-amber-500/10 dark:text-amber-500">
                      {milestone.year}
                    </span>
                    <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                      {milestone.label}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {milestone.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {milestone.description}
                  </p>
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
            <h2 className="mb-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Meet Our Team
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              A small team with big ambitions &mdash; combining deep tech
              expertise with construction industry understanding.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mb-1 font-bold text-zinc-900 dark:text-zinc-100">
                  {member.name}
                </h3>
                <p className="mb-3 text-sm text-indigo-600 dark:text-amber-500">
                  {member.role}
                </p>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {member.bio}
                </p>
                <div className="flex justify-center space-x-3">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none text-zinc-400 dark:text-zinc-600"
                  >
                    <Linkedin className="h-5 w-5" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none text-zinc-400 dark:text-zinc-600"
                  >
                    <Twitter className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Join Us in Building the Future
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Whether you&apos;re looking to transform your construction
            operations or join our team, we&apos;d love to hear from you.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/plans">
              <Button
                size="lg"
                className="bg-indigo-600 px-8 text-white hover:bg-indigo-500 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-300 bg-transparent px-8 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
