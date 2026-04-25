'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { useInView } from '@/hooks/use-in-view';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const MILESTONES = [
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

const TEAM = [
  {
    name: 'Aneesh K Johny',
    role: 'Co-Founder & CFO',
    bio: 'IITM alumnus driving financial strategy and business growth.',
    image: '/team/cfo.jpg',
    accent: '#f59e0b',
  },
  {
    name: 'Abhijith A',
    role: 'Co-Founder & CTO',
    bio: 'IITM alumnus leading technology vision and platform architecture.',
    image: '/team/cto.jpg',
    accent: '#38bdf8',
  },
  {
    name: 'Anand Rajasekhar',
    role: 'Chief Executive Officer',
    bio: 'Driving company vision, strategy, and market expansion.',
    image: '/team/ceo.png',
    accent: '#a78bfa',
  },
  {
    name: 'Abin K Johny',
    role: 'Frontend Developer',
    bio: 'Crafting intuitive and responsive user interfaces.',
    image: '/team/frontend.jpg',
    accent: '#34d399',
  },
  {
    name: 'Hrishikesh A',
    role: 'Backend Developer',
    bio: 'Building robust and scalable server-side solutions.',
    image: '/team/backend.jpg',
    accent: '#fb923c',
  },
];

const VALUES = [
  {
    title: 'Customer Focus',
    description:
      'We put customers at the center of everything, building solutions that solve real problems.',
  },
  {
    title: 'Integrity',
    description:
      'We operate with honesty and transparency in all business relationships and practices.',
  },
  {
    title: 'Innovation',
    description:
      'We continuously push boundaries to deliver cutting-edge solutions for construction.',
  },
  {
    title: 'Collaboration',
    description:
      'We believe in the power of teamwork — internally, and with our customers and partners.',
  },
];

function SectionReveal({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function AboutPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.push('/users/dashboard');
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      <MarketingNav currentPage="About Us" />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-36 pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,27,75,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,27,75,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-[0.03] dark:block"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 dark:border-amber-500/20 dark:bg-amber-500/6">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  About Echno
                </span>
              </div>
              <h1 className="mb-6 text-5xl leading-tight font-black text-zinc-900 sm:text-6xl dark:text-white">
                From IIT Madras
                <br />
                <span
                  className="text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  to the Construction Site.
                </span>
              </h1>
              <p className="mb-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tornotron Technologies Private Limited was founded in 2021 by
                IITM students with a mission to offer simplified digital
                solutions for small and medium businesses.
              </p>
              <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Starting with websites and e-commerce, we identified the unique
                challenges facing construction. That led to Echno — a
                comprehensive platform designed to streamline construction
                operations from the ground up.
              </p>
            </div>

            {/* Visual */}
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-white/6 dark:bg-zinc-900">
              <div
                className="pointer-events-none absolute inset-0 dark:hidden"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(30,27,75,0.05) 29px, rgba(30,27,75,0.05) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(30,27,75,0.05) 29px, rgba(30,27,75,0.05) 30px)',
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 hidden dark:block"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(245,158,11,0.04) 29px, rgba(245,158,11,0.04) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(245,158,11,0.04) 29px, rgba(245,158,11,0.04) 30px)',
                }}
                aria-hidden
              />
              {/* Large brand mark */}
              <div className="text-center">
                <div className="text-6xl font-black text-amber-400/30 dark:text-amber-500/20">
                  ECHNO
                </div>
                <div className="mt-2 text-sm font-semibold tracking-widest text-zinc-400/60 uppercase">
                  Construction Intelligence
                </div>
              </div>
              <div
                className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-500/10"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -top-6 -right-6 h-36 w-36 rounded-full bg-orange-400/10 blur-3xl"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-t border-b border-stone-200 bg-white px-6 py-14 dark:border-white/5 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { val: '2021', label: 'Founded' },
              { val: 'IITM', label: 'Alumni Founded' },
              { val: '2025', label: 'MVP Launched' },
              { val: '99.9%', label: 'Platform Uptime' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="mb-1 text-4xl font-black text-amber-600 dark:text-amber-500">
                  {s.val}
                </div>
                <div className="text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-stone-50 px-6 py-24 dark:bg-zinc-950">
        <SectionReveal>
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
                  Our Mission
                </div>
                <h2 className="mb-6 text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
                  Simplifying construction for every team in India.
                </h2>
                <p className="mb-6 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  To provide simplified digital solutions that empower
                  construction businesses to manage projects, teams, and
                  workflows with clarity and confidence.
                </p>
                <ul className="space-y-4">
                  {[
                    'Simplify complex project management workflows',
                    'Provide real-time visibility across all operations',
                    'Enable data-driven decision making',
                    'Build tools construction teams actually want to use',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {VALUES.map((v) => (
                  <div
                    key={v.title}
                    className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/6 dark:bg-zinc-900"
                  >
                    <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                      {v.title}
                    </h3>
                    <p className="text-sm text-zinc-500">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* Timeline */}
      <section className="border-t border-stone-200 bg-white px-6 py-24 dark:border-white/5 dark:bg-zinc-900">
        <SectionReveal>
          <div className="mx-auto max-w-3xl">
            <div className="mb-14">
              <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
                History
              </div>
              <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
                Our Journey
              </h2>
              <p className="mt-3 text-zinc-500">
                Key milestones — from foundation to launch.
              </p>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute top-0 left-5 h-full w-0.5 bg-stone-200 dark:bg-white/6" />

              <div className="space-y-10">
                {MILESTONES.map((m, i) => (
                  <div
                    key={m.year}
                    className="relative flex gap-8"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Dot */}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[10px] font-black text-white dark:border-zinc-900">
                      {m.year.slice(2)}
                    </div>
                    <div className="pt-1 pb-2">
                      <div className="mb-1 flex items-center gap-3">
                        <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-500">
                          {m.year}
                        </span>
                        <span className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                          {m.label}
                        </span>
                      </div>
                      <h3 className="mb-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {m.title}
                      </h3>
                      <p className="text-sm text-zinc-500">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* Team */}
      <section className="bg-stone-50 px-6 py-24 dark:bg-zinc-950">
        <SectionReveal>
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
                The Team
              </div>
              <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
                Meet the Builders
              </h2>
              <p className="mt-3 text-zinc-500">
                A small, focused team with deep tech expertise and construction
                ambition.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-md dark:border-white/6 dark:bg-zinc-900 dark:hover:border-white/10"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${member.accent}, transparent)`,
                    }}
                    aria-hidden
                  />
                  <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-stone-100 bg-stone-100 dark:border-white/8 dark:bg-zinc-800">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="mb-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {member.name}
                  </h3>
                  <p
                    className="mb-3 text-xs font-semibold"
                    style={{ color: member.accent }}
                  >
                    {member.role}
                  </p>
                  <p className="text-xs text-zinc-500">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 bg-white px-6 py-24 dark:border-white/5 dark:bg-zinc-900">
        <SectionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
              Join Us in Building the Future.
            </h2>
            <p className="mb-8 text-zinc-500">
              Whether you&apos;re looking to transform your construction
              operations or join our team, we&apos;d love to hear from you.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/plans">
                <button
                  className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-[1.03]"
                  style={{
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  }}
                >
                  Get Early Access{' '}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-8 py-4 text-base font-semibold text-zinc-700 transition-all duration-300 hover:border-stone-300 hover:bg-stone-100 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300 dark:hover:bg-white/8">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      <MarketingFooter />
    </div>
  );
}
